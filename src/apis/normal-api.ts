import axios from "axios";

const normalApi = axios.create({
  baseURL: import.meta.env.VITE_APP_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default normalApi;
