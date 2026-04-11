import secureApi from "@/apis/secure-api";
import { ProductType } from "@/types/products";

export function syncProducts(sinceId: number): Promise<ProductType[]> {
  return secureApi
    .get(`/sync/changelog?sinceId=${sinceId}`)
    .then((response) => response.data);
}
