import { useNavigate } from "react-router";
import { jwtDecode } from "jwt-decode";
import {
  REFRESH_TOKEN,
  TOKEN,
  CLAIM_USER_NAME,
  CLAIM_ALLOWED_LOCATIONS,
  USER_NAME,
  SHOP_ID,
} from "@/config/vars";
import { setSetting } from "@/lib/db";

const useAuthOperations = () => {
  const navigate = useNavigate();

  async function login(accessToken: string, refreshToken: string) {
    const token = jwtDecode<Record<string, string>>(accessToken);
    await setSetting(USER_NAME, token[CLAIM_USER_NAME] ?? "");
    await setSetting(SHOP_ID, String(token[CLAIM_ALLOWED_LOCATIONS] ?? ""));
    localStorage.setItem(REFRESH_TOKEN, refreshToken ?? "");
    localStorage.setItem(TOKEN, accessToken ?? "");
    navigate("/dashboard");
  }

  return { login };
};

export default useAuthOperations;
