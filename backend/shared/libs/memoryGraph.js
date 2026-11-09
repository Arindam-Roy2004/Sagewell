/**
 * Memory graph (Neo4j) query building — the ONLY place Cypher for user memories is written.
 *
 * Security model: the LLM never writes Cypher. It returns plain fields (entity type, entity
 * name, relationship, detail) and this module turns them into a fixed, parameterized query:
 *   - every value (user id, names, details) is a query parameter, never spliced into text;
 *   - the two things Cypher cannot parameterize — the node label and the relationship type —
 *     come from an allowlist / a strict identifier pattern;
 *   - every entity node is owned by one user ({ userId, name }), so one user's memories can
 *     never attach to, read, or modify another user's nodes.
 *
 * Pure functions with no dependencies, shared by the API (reads) and the worker (writes).
 */

/** Node labels the extractor may use. Anything else is rejected. */
export const ENTITY_LABELS = Object.freeze([
  "Place",
  "Person",
  "Organization",
  "Project",
  "Technology",
  "Skill",
  "Hobby",
  "Event",
  "Movie",
  "Book",
  "Dish",
  "Product",
  "Topic",
]);

const LABEL_SET = new Set(ENTITY_LABELS);
const FALLBACK_RELATIONSHIP = "relatedTo";
const RELATIONSHIP_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,49}$/;

const MAX_NAME = 200;
const MAX_EVENT = 100;
const MAX_DETAIL = 500;

const cleanText = (value, max) => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
};

/**
 * Turns a free-form relationship ("traveled to", "works-at", "LIKES") into a safe camelCase
 * identifier ("traveledTo", "worksAt", "likes"). Falls back to "relatedTo" when nothing
 * usable remains. The result always matches RELATIONSHIP_PATTERN, so it is safe to use as a
 * backtick-quoted relationship type.
 */
export function normalizeRelationship(raw) {
  if (typeof raw !== "string") return FALLBACK_RELATIONSHIP;
  const words = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // split existing camelCase
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (!words.length) return FALLBACK_RELATIONSHIP;

  const camel = words
    .map((w, i) => {
      const lower = w.toLowerCase();
      return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("")
    .slice(0, 50);

  return RELATIONSHIP_PATTERN.test(camel) ? camel : FALLBACK_RELATIONSHIP;
}

/**
 * Builds the write query for one extracted episodic memory.
 *
 * @param {{ entityType?: string, entityName?: string, relationship?: string, eventName?: string, detail?: string|null }} episode
 * @param {string} userId
 * @returns {{ cypher: string, params: object } | null} null when the episode is unusable.
 */
export function buildEpisodeWrite(episode, userId) {
  const owner = typeof userId === "string" ? userId : userId?.toString?.();
  if (!owner || !episode || typeof episode !== "object") return null;

  const label = episode.entityType;
  if (!LABEL_SET.has(label)) return null;

  const name = cleanText(episode.entityName, MAX_NAME);
  if (!name) return null;

  const relationship = normalizeRelationship(episode.relationship);
  // Defense in depth: never build a query around an identifier that fails the pattern.
  if (!RELATIONSHIP_PATTERN.test(relationship)) return null;

  const detail = cleanText(episode.detail, MAX_DETAIL) || null;

  const cypher = `
MERGE (u:User {id: $userId})
MERGE (e:\`${label}\` {userId: $userId, name: $name})
MERGE (u)-[r:\`${relationship}\`]->(e)
ON CREATE SET r.createdAt = timestamp()
SET r.event = $event, r.detail = coalesce($detail, r.detail), r.updatedAt = timestamp()
`.trim();

  return {
    cypher,
    params: {
      userId: owner,
      name,
      event: cleanText(episode.eventName, MAX_EVENT) || null,
      detail,
    },
  };
}

/**
 * Read query for a user's own memory graph: direct neighbours of the user's node only.
 *
 * Other User nodes are never traversed, and a neighbour must be owned by this user. Nodes
 * written before ownership existed (no userId) are still returned, but callers must show only
 * their `name` (see describeGraphNode), since such legacy nodes may have been shared.
 * Returns rows of { r: [relationship], n: node }. Parameter: { userId }.
 */
export const USER_GRAPH_READ_CYPHER = `
MATCH (u:User {id: $userId})-[rel]-(n)
WHERE NOT n:User AND (n.userId IS NULL OR n.userId = $userId)
RETURN [rel] AS r, n
LIMIT 25
`.trim();

/**
 * Safe, prompt-ready view of a node from USER_GRAPH_READ_CYPHER: its label and the
 * properties it is fine to show. Internal keys (id, userId) are never included; legacy nodes
 * with no owner show only their name.
 */
export function describeGraphNode(node, userId) {
  const props = node?.properties || {};
  const owned = props.userId !== undefined && props.userId === userId.toString();
  const visible = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "id" || key === "userId") continue;
    if (!owned && key !== "name") continue;
    visible[key] = value;
  }
  return { label: node?.labels?.[0] || "Entity", properties: visible };
}
