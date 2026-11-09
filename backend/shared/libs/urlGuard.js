import dns from "dns";
import net from "net";

/**
 * SSRF guard.
 *
 * Why: when we fetch a user-supplied URL from our server, the request originates
 * from INSIDE our trusted network. Without checks, a user could point us at
 * cloud metadata (169.254.169.254), localhost services (Redis/Mongo), or other
 * machines on our private subnet. We therefore:
 *   1. allow only http/https,
 *   2. resolve the hostname to its real IP(s) via DNS,
 *   3. reject if ANY resolved IP falls in a private/loopback/link-local/reserved range.
 *
 * `assertSafeUrl` is an early, friendly check (used before queueing). It does NOT by itself
 * stop DNS rebinding, because the HTTP client resolves the name again when it connects.
 * Code that actually fetches must connect through `safeLookup`, which runs the same check on
 * the exact addresses the socket will use (see worker/processors/webProcessor.js).
 */

// Every range that is not ordinary public unicast. IPv4-mapped IPv6 (::ffff:a.b.c.d) is
// matched against the IPv4 rules by net.BlockList itself.
const BLOCKED = new net.BlockList();
for (const [prefix, bits] of [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (cloud metadata)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
]) {
  BLOCKED.addSubnet(prefix, bits, "ipv4");
}
for (const [prefix, bits] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["::", 96], // IPv4-compatible (deprecated) — can embed a private IPv4
  ["64:ff9b::", 96], // NAT64 — embeds an IPv4
  ["64:ff9b:1::", 48], // local-use NAT64
  ["100::", 64], // discard
  ["2001::", 32], // Teredo — embeds an IPv4
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 — embeds an IPv4
  ["fc00::", 7], // unique-local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // site-local (deprecated)
  ["ff00::", 8], // multicast
]) {
  BLOCKED.addSubnet(prefix, bits, "ipv6");
}

/** True if the address is a literal IP in a public unicast range. Anything else is unsafe. */
export function isPublicAddress(ip) {
  const family = net.isIP(ip);
  if (family === 4) return !BLOCKED.check(ip, "ipv4");
  if (family === 6) return !BLOCKED.check(ip, "ipv6");
  return false; // not an IP → treat as unsafe
}

// WHATWG URL keeps IPv6 literals in brackets ("[::1]"); strip them before IP checks.
const bareHost = (hostname) => hostname.replace(/^\[|\]$/g, "").toLowerCase();

function isBlockedHostname(hostname) {
  return hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".internal");
}

/**
 * Throws if the URL is not safe to fetch from the server. Returns the parsed URL otherwise.
 * @param {string} rawUrl
 */
export async function assertSafeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("URLs with embedded credentials are not allowed");
  }

  const hostname = bareHost(url.hostname);
  if (isBlockedHostname(hostname)) {
    throw new Error("This host is not allowed");
  }

  // If the host is already a literal IP, check it directly.
  if (net.isIP(hostname)) {
    if (!isPublicAddress(hostname)) throw new Error("This address range is not allowed");
    return url;
  }

  // Otherwise resolve DNS and verify every returned address is public.
  let addresses;
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new Error("Could not resolve this host");
  }

  if (!addresses.length) throw new Error("Could not resolve this host");

  for (const { address } of addresses) {
    if (!isPublicAddress(address)) {
      throw new Error("This host resolves to a private address and is not allowed");
    }
  }

  return url;
}

/**
 * Drop-in `lookup` for http/https/net that refuses to connect to non-public addresses.
 *
 * Because the check runs on the very addresses the socket connects to, a DNS answer that
 * changes between the early check and the connection (DNS rebinding) cannot reach an
 * internal host. Signature matches dns.lookup (Node calls it with { all: true } when
 * autoSelectFamily is on, and without it otherwise).
 */
export function safeLookup(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  const opts = typeof options === "number" ? { family: options } : { ...(options || {}) };
  const host = bareHost(hostname);

  const reject = (message) => {
    const err = new Error(message);
    err.code = "ESSRFBLOCKED";
    callback(err);
  };

  if (isBlockedHostname(host)) return reject("This host is not allowed");

  dns.lookup(host, { ...opts, all: true }, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses?.length) return reject("Could not resolve this host");
    if (addresses.some(({ address }) => !isPublicAddress(address))) {
      return reject("This host resolves to a private address and is not allowed");
    }
    if (opts.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}
