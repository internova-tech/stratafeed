export type Plan = "free" | "pro" | "enterprise";
export type RequestedMode = "mock" | "delayed" | "realtime";

export type Entitlement = {
  plan: Plan;
  maxSymbols: number;
  allowedModes: RequestedMode[];
};

const PLAN_ENTITLEMENTS: Record<Plan, Entitlement> = {
  free: { plan: "free", maxSymbols: 5, allowedModes: ["mock", "delayed"] },
  pro: { plan: "pro", maxSymbols: 100, allowedModes: ["mock", "delayed", "realtime"] },
  enterprise: { plan: "enterprise", maxSymbols: 1000, allowedModes: ["mock", "delayed", "realtime"] },
};

export function entitlementFor(plan: Plan): Entitlement {
  return { ...PLAN_ENTITLEMENTS[plan], allowedModes: [...PLAN_ENTITLEMENTS[plan].allowedModes] };
}

export function assertSubscriptionAllowed(plan: Plan, requestedSymbols: string[], requestedMode: RequestedMode): void {
  const entitlement = PLAN_ENTITLEMENTS[plan];
  if (!entitlement) throw new Error("Unknown subscription plan");
  const symbols = [...new Set(requestedSymbols.map((s) => s.toUpperCase()))];
  if (symbols.some((s) => !/^[A-Z0-9][A-Z0-9._:/-]{0,39}$/.test(s))) throw new Error("Invalid symbol");
  if (symbols.length > entitlement.maxSymbols) throw new Error(`Plan ${plan} allows at most ${entitlement.maxSymbols} symbols`);
  if (!entitlement.allowedModes.includes(requestedMode)) throw new Error(`Plan ${plan} does not allow ${requestedMode} data`);
}
