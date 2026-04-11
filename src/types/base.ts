export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  CREDIT = "CREDIT",
  MULTIPLE = "MULTIPLE",
}

export enum SellingUnit {
  NOS = "NOS",
  PACK = "PACK",
}

export interface LoginType {
  username: string;
  password: string;
}
