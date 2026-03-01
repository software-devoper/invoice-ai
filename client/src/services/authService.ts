import { api } from "./api";
import type { User } from "../types";

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  register: async (payload: { username: string; email: string; password: string }) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  },

  verifyEmail: async (token: string) => {
    const { data } = await api.post("/auth/verify-email", { token });
    return data;
  },

  login: async (payload: { username: string; password: string }) => {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  me: async () => {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },
};

