// Regression tests for the security fixes: SSRF guard, memory-graph query building, and
// upload-size validation. Pure logic, no network or database.
import { describe, test, expect } from "bun:test";

import { isPublicAddress, assertSafeUrl, safeLookup } from "../shared/libs/urlGuard.js";
import {
  ENTITY_LABELS,
  USER_GRAPH_READ_CYPHER,
  buildEpisodeWrite,
  describeGraphNode,
  normalizeRelationship,
} from "../shared/libs/memoryGraph.js";
import PresignUploadDto from "../src/dto/source/presign-upload.dto.js";

describe("SSRF guard: address classification", () => {
  test.each([
    "127.0.0.1",
    "10.0.0.5",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:a9fe:a9fe",
    "::127.0.0.1",
    "64:ff9b::a9fe:a9fe",
    "2002:7f00:1::",
    "2001:0:4136:e378::",
    "fd00::1",
    "fe80::1",
    "ff02::1",
    "not-an-ip",
  ])("blocks %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  test.each(["8.8.8.8", "1.1.1.1", "93.184.215.14", "::ffff:8.8.8.8", "2606:4700:4700::1111"])(
    "allows public %s",
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    }
  );
});

describe("SSRF guard: assertSafeUrl", () => {
  test.each([
    ["http://127.0.0.1/", "This address range is not allowed"],
    ["http://[::1]/", "This address range is not allowed"],
    ["http://[::ffff:127.0.0.1]/", "This address range is not allowed"],
    ["http://2130706433/", "This address range is not allowed"], // 127.0.0.1 as an integer
    ["http://0x7f.1/", "This address range is not allowed"],
    ["http://169.254.169.254/latest/meta-data/", "This address range is not allowed"],
    ["http://localhost:8080/", "This host is not allowed"],
    ["http://redis.internal/", "This host is not allowed"],
    ["http://user:pass@example.com/", "URLs with embedded credentials are not allowed"],
    ["file:///etc/passwd", "Only http and https URLs are allowed"],
    ["not a url", "Invalid URL"],
  ])("rejects %s", async (url, message) => {
    await expect(assertSafeUrl(url)).rejects.toThrow(message);
  });

  test("accepts a public IP literal without DNS", async () => {
    const url = await assertSafeUrl("https://[2606:4700:4700::1111]/");
    expect(url.protocol).toBe("https:");
  });

  test("safeLookup refuses blocked hostnames at connect time", async () => {
    const err = await new Promise((resolve) => safeLookup("localhost", { all: true }, (e) => resolve(e)));
    expect(err?.code).toBe("ESSRFBLOCKED");
  });

  test("safeLookup refuses names that resolve to private addresses", async () => {
    // A name with a dot that the OS resolver maps to loopback: use the IP literal path of dns.lookup.
    const err = await new Promise((resolve) => safeLookup("127.0.0.1", {}, (e) => resolve(e)));
    expect(err?.code).toBe("ESSRFBLOCKED");
  });
});

describe("memory graph: buildEpisodeWrite", () => {
  const userId = "64b7f0c2a1b2c3d4e5f60718";
  const episode = {
    entityType: "Place",
    entityName: "Manali",
    relationship: "traveledTo",
    detail: "Trekking, last summer",
    eventName: "Manali trip",
  };

  test("builds a parameterized, user-scoped MERGE", () => {
    const write = buildEpisodeWrite(episode, userId);
    expect(write.params).toEqual({
      userId,
      name: "Manali",
      event: "Manali trip",
      detail: "Trekking, last summer",
    });
    expect(write.cypher).toContain("MERGE (e:`Place` {userId: $userId, name: $name})");
    expect(write.cypher).toContain("MERGE (u)-[r:`traveledTo`]->(e)");
    // Values never appear in the query text.
    expect(write.cypher).not.toContain("Manali");
    expect(write.cypher).not.toContain(userId);
  });

  test("rejects labels outside the allowlist", () => {
    for (const entityType of ["User", "Place`) DETACH DELETE (x", "", undefined, "place"]) {
      expect(buildEpisodeWrite({ ...episode, entityType }, userId)).toBeNull();
    }
  });

  test("rejects missing names and owners", () => {
    expect(buildEpisodeWrite({ ...episode, entityName: "   " }, userId)).toBeNull();
    expect(buildEpisodeWrite(episode, "")).toBeNull();
    expect(buildEpisodeWrite(null, userId)).toBeNull();
  });

  test("injection attempts in values stay inert parameters", () => {
    const evil = "x'}) MATCH (n) DETACH DELETE n //";
    const write = buildEpisodeWrite({ ...episode, entityName: evil, detail: evil, eventName: evil }, userId);
    expect(write.cypher).not.toContain("DETACH DELETE");
    expect(write.params.name).toBe(evil);
  });

  test("relationship types are reduced to a safe identifier", () => {
    expect(normalizeRelationship("traveledTo")).toBe("traveledTo");
    expect(normalizeRelationship("works at")).toBe("worksAt");
    expect(normalizeRelationship("LIKES")).toBe("likes");
    expect(normalizeRelationship("r]->(x) DETACH DELETE x //")).toBe("rXDetachDeleteX");
    expect(normalizeRelationship("`")).toBe("relatedTo");
    expect(normalizeRelationship("123")).toBe("relatedTo");
    expect(normalizeRelationship(undefined)).toBe("relatedTo");
    expect(normalizeRelationship("a".repeat(80)).length).toBeLessThanOrEqual(50);
    for (const raw of ["a`b", "x]-(y", "has space", "ünïcode", "$param"]) {
      expect(normalizeRelationship(raw)).toMatch(/^[A-Za-z][A-Za-z0-9_]{0,49}$/);
    }
  });

  test("long text is truncated", () => {
    const write = buildEpisodeWrite({ ...episode, entityName: "n".repeat(500), detail: "d".repeat(900) }, userId);
    expect(write.params.name.length).toBe(200);
    expect(write.params.detail.length).toBe(500);
  });

  test("every allowed label is a plain identifier", () => {
    for (const label of ENTITY_LABELS) expect(label).toMatch(/^[A-Z][A-Za-z]+$/);
  });
});

describe("memory graph: reads stay inside the user's own graph", () => {
  test("read query never traverses other users", () => {
    expect(USER_GRAPH_READ_CYPHER).toContain("NOT n:User");
    expect(USER_GRAPH_READ_CYPHER).toContain("n.userId IS NULL OR n.userId = $userId");
    expect(USER_GRAPH_READ_CYPHER).not.toContain("*");
  });

  test("owned nodes show their properties, minus internal keys", () => {
    const node = { labels: ["Place"], properties: { userId: "u1", name: "Manali", id: "x", season: "Summer" } };
    expect(describeGraphNode(node, "u1")).toEqual({ label: "Place", properties: { name: "Manali", season: "Summer" } });
  });

  test("legacy (unowned) and foreign nodes show only their name", () => {
    const legacy = { labels: ["Place"], properties: { name: "Manali", note: "injected by someone else" } };
    expect(describeGraphNode(legacy, "u1").properties).toEqual({ name: "Manali" });
    const foreign = { labels: ["Place"], properties: { userId: "u2", name: "Goa", note: "private" } };
    expect(describeGraphNode(foreign, "u1").properties).toEqual({ name: "Goa" });
  });
});

describe("upload size validation", () => {
  const base = { fileName: "a.pdf", fileType: "application/pdf" };

  test("accepts a whole number of bytes", () => {
    expect(PresignUploadDto.validate({ ...base, fileSize: 1024 }).errors).toBeNull();
  });

  test("rejects fractional, zero, negative and non-numeric sizes", () => {
    for (const fileSize of [10.5, 0, -1, "1024"]) {
      expect(PresignUploadDto.validate({ ...base, fileSize }).errors).not.toBeNull();
    }
  });
});
