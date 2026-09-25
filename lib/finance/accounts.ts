export type FinanceAccountKind = "current" | "savings";
export type FinanceAccountOwner = "shared" | "personal";

type AccountDefinition = {
  label: string;
  kind: FinanceAccountKind;
  owner: FinanceAccountOwner;
};

const accountDefinitions: Record<string, AccountDefinition> = {
  "2977": { label: "Gezamenlijk lopend", kind: "current", owner: "shared" },
  "6577": { label: "Persoonlijk lopend", kind: "current", owner: "personal" },
  "5765": { label: "Gezamenlijk sparen", kind: "savings", owner: "shared" },
  "2643": { label: "Persoonlijk sparen", kind: "savings", owner: "personal" },
};

export function accountDefinition(iban: string): AccountDefinition | null {
  const suffix = iban.replace(/\s/g, "").slice(-4);
  return accountDefinitions[suffix] ?? null;
}

export function namedAccount<T extends { iban: string; label: string; kind: string; owner: string }>(account: T): T {
  const definition = accountDefinition(account.iban);
  return definition ? { ...account, ...definition } : account;
}
