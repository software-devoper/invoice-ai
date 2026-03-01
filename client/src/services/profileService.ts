import { api } from "./api";
import type { Profile } from "../types";

export const profileService = {
  get: async () => {
    const { data } = await api.get<{ profile: Profile }>("/profile");
    return data.profile;
  },

  save: async (payload: FormData | Partial<Profile>) => {
    const config =
      payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined;
    const { data } = await api.put<{ profile: Profile; message: string }>("/profile", payload, config);
    return data;
  },
};

