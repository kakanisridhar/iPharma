import normalApi from "@/apis/normal-api";
import { LoginType } from "@/types/base";

export function loginToServer(login: LoginType) {
  return normalApi.post("/auth/login", login);
}
