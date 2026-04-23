import type { ProductType, ProductBatchType } from "./products";
import type { BatchWithInventory } from "./inventory";
import { PaymentMethod } from "./base";

export type { PaymentMethod };

export interface CartItem {
  id: string;
  product: ProductType;
  batch: BatchWithInventory;
  /** Individual unit count (loose items) */
  quantity: number;
  /** Full pack count */
  packCount: number;
  /** Selling individual items from inside a sealed pack */
  isSplitPack: boolean;
  /** A new sealed pack must be opened to fulfill this order */
  isNewPackSplit: boolean;
  /** Calculated by Rust — all values in paise */
  unitPrice: number;
  grossPrice: number;
  tax: number;
  netPrice: number;
}

/** Sent to Rust for precise integer arithmetic (all prices in paise) */
export interface SaleLineInput {
  sellPrice: number;
  /** VAT in basis points, e.g. 18% → 1800 */
  vatRate: number;
  quantity: number;
  packCount: number;
  itemsPerPack: number;
  isSplitPack: boolean;
}

/** Returned from Rust (all values in paise) */
export interface SaleLineResult {
  unitPrice: number;
  grossPrice: number;
  tax: number;
  netPrice: number;
}

export interface SaleTotalsResult {
  lines: SaleLineResult[];
  totalGross: number;
  totalTax: number;
  totalNet: number;
}

export interface CreateSaleInput {
  saleDate: string;
  customerName?: string;
  customerType?: string;
  discountType: number;
  /** In paise */
  discount: number;
  grossPrice: number;
  tax: number;
  netPrice: number;
  amountToPay: number;
  paymentMethod: PaymentMethod;
  cashTendered: number;
  cashChangeGiven: number;
  items: CreateSaleLineItem[];
}

export interface CreateSaleLineItem {
  idx: number;
  productId: number;
  productBatchId: number;
  quantity: number;
  packCount: number;
  /** In paise */
  unitPrice: number;
  grossPrice: number;
  tax: number;
  netPrice: number;
  /** VAT in basis points (1800 = 18%) */
  vatRate: number;
  isSplitPack: boolean;
  isNewPackSplit: boolean;
}
