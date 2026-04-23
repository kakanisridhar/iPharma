export interface InventorCount {
  id: number;
  quantity: number;
  packCount: number;

  productId: number;
  productBatchId: number;
  locationId: number;
  lastModifiedDate: string;
}

export interface BatchWithInventory {
  id: number;
  batchNumber: string;
  expiryDate: string;
  /** Loose individual units in stock */
  quantity: number;
  /** Full sealed packs in stock */
  packCount: number;
}
