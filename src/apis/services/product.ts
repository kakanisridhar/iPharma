import secureApi from "@/apis/secure-api";
import { ProductType, SyncProductsResponse } from "@/types/products";

export function syncProducts(sinceId: number): Promise<SyncProductsResponse> {
  return secureApi
    .get(`/products/sync/changes?sinceId=${sinceId}`)
    .then((response) => response.data);
}

export function syncProductsFull(
  sinceId: number,
): Promise<SyncProductsResponse> {
  return secureApi.get("/products/sync/full").then((response) => response.data);
}
