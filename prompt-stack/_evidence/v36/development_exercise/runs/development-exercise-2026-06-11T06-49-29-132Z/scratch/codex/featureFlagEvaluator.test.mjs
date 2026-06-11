import assert from "node:assert/strict";
import { evaluateFeatureFlag } from "./featureFlagEvaluator.mjs";

const baseFlag = {
  key: "checkout-redesign",
  enabled: true,
  rolloutPercentage: 100
};

const cases = [
  {
    name: "disabled flag returns off",
    flag: { ...baseFlag, enabled: false },
    context: { userId: "u1", country: "US" },
    expected: { enabled: false, reason: "flag-disabled", variant: null }
  },
  {
    name: "blocklist has highest priority",
    flag: { ...baseFlag, allowlist: ["u1"], blocklist: ["u1"] },
    context: { userId: "u1", country: "US" },
    expected: { enabled: false, reason: "user-blocked", variant: null }
  },
  {
    name: "allowlist enables targeted user",
    flag: { ...baseFlag, rolloutPercentage: 0, allowlist: ["u2"], variants: [{ name: "control", weight: 1 }] },
    context: { userId: "u2", country: "US" },
    expected: { enabled: true, reason: "user-allowlisted", variant: "control" }
  },
  {
    name: "country targeting excludes non-target country",
    flag: { ...baseFlag, countries: ["US"] },
    context: { userId: "u3", country: "KR" },
    expected: { enabled: false, reason: "country-not-targeted", variant: null }
  },
  {
    name: "zero rollout excludes ordinary user",
    flag: { ...baseFlag, rolloutPercentage: 0 },
    context: { userId: "u4", country: "US" },
    expected: { enabled: false, reason: "rollout-bucket-excluded", variant: null }
  },
  {
    name: "enabled full rollout selects weighted variant",
    flag: { ...baseFlag, variants: [{ name: "control", weight: 0 }, { name: "treatment", weight: 100 }] },
    context: { userId: "u5", country: "US" },
    expected: { enabled: true, reason: "rollout-bucket-included", variant: "treatment" }
  }
];

let passed = 0;
for (const item of cases) {
  assert.deepEqual(evaluateFeatureFlag(item.flag, item.context), item.expected, item.name);
  passed += 1;
}

console.log(`${passed}/${cases.length} tests passed`);
