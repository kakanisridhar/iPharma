import { SellingUnit } from "./base";

export interface ProductType {
  id: number;
  name: string;
  brand?: string;

  buyPrice: number;
  sellPrice: number;
  merchantPrice?: number;
  vat?: number;

  sellingUnit: SellingUnit;
  tabletsPerStrip?: number;
  itemsPerPack?: number;
}

export interface ProductBatchType {
  id: number;
  batchNumber: string;
  expiryDate: Date | string;
}

export interface ProductChangeType {
  productId: number;
  isDeleted: boolean;
  product: ProductType;
  productBatches: ProductBatchType[];
}

export interface SyncProductsResponse {
  lastChangeId: number;
  products: ProductChangeType[];
}
