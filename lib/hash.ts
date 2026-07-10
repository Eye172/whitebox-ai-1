// Deterministic tamper-evident hash for the append-only audit chain (Book I · Part XII).
// FNV-1a 64-bit-ish, folded to a 12-char hex — enough to demonstrate hash-chaining in the UI.
export function wbHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ((c << 3) | 7), 0x85ebca6b) >>> 0;
  }
  const hex = (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 12);
  return hex;
}

// Compute the chained hash for one audit entry given the previous entry's hash.
export function chainHash(
  prevHash: string,
  payload: { timestamp: string; actor: string; action: string; target: string; reason: string; versions: string }
): string {
  return wbHash(
    [prevHash, payload.timestamp, payload.actor, payload.action, payload.target, payload.reason, payload.versions].join("|")
  );
}

export function shortHash(h: string): string {
  return h.length > 8 ? `${h.slice(0, 6)}…${h.slice(-2)}` : h;
}
