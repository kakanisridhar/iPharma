import secureApi from "@/apis/secure-api";
import { InventorCount } from "@/types/inventory";

export function syncInventory(): Promise<InventorCount[]> {
  return secureApi.get("/inventory").then((response) => response.data);
}
