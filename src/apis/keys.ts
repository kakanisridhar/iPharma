export const salesKeys = {
  all: ["sales"] as const,
  filters: (filters: Record<string, string | number>) =>
    [...salesKeys.all, ...Object.values(filters)] as const,
};

export const purchaseKeys = {
  all: ["purchases"] as const,
  filters: (filters: Record<string, string | number>) =>
    [...purchaseKeys.all, ...Object.values(filters)] as const,
};

export const movementKeys = {
  all: ["movements"] as const,
  filters: (filters: Record<string, string | number>) =>
    [...movementKeys.all, ...Object.values(filters)] as const,
};

export const adjustmentKeys = {
  all: ["adjustments"] as const,
  filters: (filters: Record<string, string | number>) =>
    [...adjustmentKeys.all, ...Object.values(filters)] as const,
};

export const reporKeys = {
  inventory: ["inventory"] as const,
  inventoryValue: ["inventory-value"] as const,

  inventoryFilters: (filters: Record<string, string | number>) =>
    [...reporKeys.inventory, ...Object.values(filters)] as const,

  reportWithFilters: (
    report: string,
    filters: Record<string, string | number>,
  ) => [report, ...Object.values(filters)] as const,
};

export const transactionsKeys = {
  all: ["transactions"] as const,
  filters: (filters: Record<string, string | number>) =>
    [...transactionsKeys.all, ...Object.values(filters)] as const,
};
