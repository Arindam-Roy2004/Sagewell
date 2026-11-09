// Read-only audit of the memory graph after the "LLM-written Cypher" fix.
//
// Run inside the API container (it has the env and the neo4j driver):
//   docker exec sagewell-api bun scripts/neo4j-memory-audit.js
//
// It reports:
//   1. the Neo4j edition and the roles of the user the app connects as;
//   2. legacy nodes with no owner (written before per-user ownership), by label;
//   3. legacy nodes shared by several users, and nodes with properties beyond `name`
//      (the shapes that could have been injected through the old flaw);
//   4. whether a least-privilege app user is possible, and the Cypher to create one.
//
// It never writes to the database.
import "../shared/libs/env.js";
import neo4j from "neo4j-driver";

const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
const DATABASE = process.env.NEO4J_DATABASE || process.env.NEO4J_DATABASE_NAME || "neo4j";

if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  console.log("Neo4j is not configured (NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD). Nothing to audit.");
  process.exit(0);
}

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
const session = driver.session({ database: DATABASE, defaultAccessMode: neo4j.session.READ });
const toNum = (v) => (neo4j.isInt(v) ? v.toNumber() : v);

async function rows(cypher, params = {}) {
  const result = await session.run(cypher, params);
  return result.records.map((r) => Object.fromEntries(r.keys.map((k) => [k, toNum(r.get(k))])));
}

async function trySystem(cypher) {
  const sys = driver.session({ database: "system", defaultAccessMode: neo4j.session.READ });
  try {
    const result = await sys.run(cypher);
    return result.records.map((r) => r.toObject());
  } catch (error) {
    return { error: error.message };
  } finally {
    await sys.close();
  }
}

try {
  console.log("── Server ─────────────────────────────────────────");
  const [component] = await rows("CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] AS version, edition");
  console.log(`${component.name} ${component.version} (${component.edition} edition), database "${DATABASE}"`);

  const me = await trySystem("SHOW CURRENT USER YIELD user, roles RETURN user, roles");
  console.log("App connects as:", Array.isArray(me) ? `${me[0]?.user} with roles ${JSON.stringify(me[0]?.roles)}` : `(could not read: ${me.error})`);

  console.log("\n── Memory graph ───────────────────────────────────");
  const [totals] = await rows(`
    MATCH (n) RETURN
      count(CASE WHEN n:User THEN 1 END) AS users,
      count(CASE WHEN NOT n:User AND n.userId IS NOT NULL THEN 1 END) AS ownedEntities,
      count(CASE WHEN NOT n:User AND n.userId IS NULL THEN 1 END) AS legacyEntities`);
  console.log(`User nodes: ${totals.users}`);
  console.log(`Owned entity nodes (new format): ${totals.ownedEntities}`);
  console.log(`Legacy entity nodes (no owner): ${totals.legacyEntities}`);

  if (totals.legacyEntities > 0) {
    console.log("\nLegacy nodes by label:");
    for (const r of await rows(`
      MATCH (n) WHERE NOT n:User AND n.userId IS NULL
      RETURN coalesce(head(labels(n)), "(no label)") AS label, count(*) AS count
      ORDER BY count DESC`)) {
      console.log(`  ${r.label}: ${r.count}`);
    }

    const shared = await rows(`
      MATCH (u:User)--(n) WHERE NOT n:User AND n.userId IS NULL
      WITH n, count(DISTINCT u) AS owners WHERE owners > 1
      RETURN coalesce(head(labels(n)), "(no label)") AS label, n.name AS name, owners
      ORDER BY owners DESC LIMIT 20`);
    console.log(`\nLegacy nodes linked to more than one user: ${shared.length}${shared.length === 20 ? "+" : ""}`);
    for (const r of shared) console.log(`  ${r.label} "${r.name}" — ${r.owners} users`);

    const extra = await rows(`
      MATCH (n) WHERE NOT n:User AND n.userId IS NULL
      WITH n, [k IN keys(n) WHERE k <> "name"] AS extraKeys WHERE size(extraKeys) > 0
      RETURN coalesce(head(labels(n)), "(no label)") AS label, n.name AS name, extraKeys
      LIMIT 20`);
    console.log(`\nLegacy nodes with properties beyond "name": ${extra.length}${extra.length === 20 ? "+" : ""}`);
    for (const r of extra) console.log(`  ${r.label} "${r.name}" — ${JSON.stringify(r.extraKeys)}`);

    const orphans = await rows(`
      MATCH (n) WHERE NOT n:User AND n.userId IS NULL AND NOT (n)--(:User)
      RETURN count(n) AS count`);
    console.log(`\nLegacy nodes not linked to any user: ${orphans[0].count}`);

    console.log(
      "\nThe app no longer shows legacy nodes' extra properties, and never shows a node to a user who isn't linked to it."
    );
  }

  console.log("\n── Least-privilege app user ───────────────────────");
  const supportsRbac = component.edition === "enterprise";
  if (!supportsRbac) {
    console.log(
      "This edition has no custom roles (AuraDB Free/Professional and Community allow only the built-in admin).\n" +
        "Nothing to change here; the code fix alone stops model-written queries."
    );
  } else {
    console.log("Run this as an admin, in the system database, with a strong generated password:\n");
    console.log(`CREATE ROLE sagewell_app IF NOT EXISTS;
GRANT ACCESS ON DATABASE \`${DATABASE}\` TO sagewell_app;
GRANT MATCH {*} ON GRAPH \`${DATABASE}\` TO sagewell_app;
GRANT WRITE ON GRAPH \`${DATABASE}\` TO sagewell_app;
GRANT NAME MANAGEMENT ON DATABASE \`${DATABASE}\` TO sagewell_app;
GRANT INDEX MANAGEMENT ON DATABASE \`${DATABASE}\` TO sagewell_app;
GRANT CONSTRAINT MANAGEMENT ON DATABASE \`${DATABASE}\` TO sagewell_app;
CREATE USER sagewell_app IF NOT EXISTS SET PASSWORD '<generated password>' CHANGE NOT REQUIRED;
GRANT ROLE sagewell_app TO sagewell_app;`);
    console.log(
      "\nThen set NEO4J_USERNAME=sagewell_app and NEO4J_PASSWORD in /root/app/sagewell/.env and redeploy.\n" +
        "The role has no server-admin rights and no access to other databases."
    );
  }
} catch (error) {
  console.error("Audit failed:", error.message);
  process.exitCode = 1;
} finally {
  await session.close();
  await driver.close();
}
