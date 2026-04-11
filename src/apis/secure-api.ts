import axios from "axios";
import Cookie from "js-cookie";
import { REFRESH_TOKEN, TOKEN } from "@/config/vars";

const secureApi = axios.create({
  baseURL: import.meta.env.VITE_APP_URL + import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

secureApi.interceptors.request.use(
  function (config) {
    const token = Cookie.get(TOKEN);
    config.headers.Authorization = token ? `Bearer ${token}` : "";
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

secureApi.interceptors.response.use(
  (response) => {
    return response;
  }, // Directly return successful responses.
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark the request as retried to avoid infinite loops.
      try {
        console.log(
          "access token expired , getting new one using refresh token"
        );
        const refreshToken = Cookie.get(REFRESH_TOKEN); // Retrieve the stored refresh token.
        // Make a request to your auth server to refresh the token.
        const response = await axios.post(
          import.meta.env.VITE_APP_URL + "/auth/refresh_token",
          null,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );
        const { access_token: accessToken, refresh_token: newRefreshToken } =
          response.data;
        // Store the new access and refresh tokens.
        Cookie.set(TOKEN, accessToken);
        Cookie.set(REFRESH_TOKEN, newRefreshToken);
        // Update the authorization header with the new access token.
        secureApi.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${accessToken}`;
        return secureApi(originalRequest); // Retry the original request with the new access token.
      } catch (refreshError) {
        // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
        console.error("Token refresh failed:", refreshError);
        Cookie.remove(TOKEN);
        Cookie.remove(REFRESH_TOKEN);
        window.location.href = "#/login";
        return Promise.reject(refreshError);
      }
    } else {
      console.log("Error from server");
    }
    return Promise.reject(error); // For all other errors, return the error as is.
  }
);

export default secureApi;
