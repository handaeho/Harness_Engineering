export function evaluateFeatureFlag(flag = {}, context = {}) {
  const userId = String(context.userId ?? "");
  if (flag.enabled !== true) return outcome(false, "flag-disabled", null);

  const blocklist = new Set(flag.blocklist || []);
  if (blocklist.has(userId)) return outcome(false, "user-blocked", null);

  const allowlist = new Set(flag.allowlist || []);
  if (allowlist.has(userId)) return outcome(true, "user-allowlisted", selectVariant(flag.variants));

  const countries = Array.isArray(flag.countries) ? flag.countries : [];
  if (countries.length > 0 && !countries.includes(context.country)) {
    return outcome(false, "country-not-targeted", null);
  }

  const rollout = clamp(Number(flag.rolloutPercentage ?? 100), 0, 100);
  if (rollout <= 0) return outcome(false, "rollout-bucket-excluded", null);

  const bucket = bucketUser(userId || "anonymous", flag.key || "feature");
  if (bucket >= rollout) return outcome(false, "rollout-bucket-excluded", null);

  return outcome(true, "rollout-bucket-included", selectVariant(flag.variants));
}

export function bucketUser(userId, key) {
  const input = `${key}:${userId}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 100;
}

function selectVariant(variants = []) {
  const valid = variants.filter((variant) => variant && variant.weight > 0);
  if (valid.length === 0) return null;
  return valid.sort((left, right) => right.weight - left.weight)[0].name;
}

function outcome(enabled, reason, variant) {
  return { enabled, reason, variant };
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return max;
  return Math.min(max, Math.max(min, value));
}
