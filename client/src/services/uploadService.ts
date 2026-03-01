import { api } from "./api";
import type { Customer, Profile } from "../types";

interface ParseResponse {
  message: string;
  batchId: string;
  customers: Customer[];
}

export const uploadService = {
  parseFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post<ParseResponse>("/upload/parse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  saveAdvancedSettings: async (payload: Partial<Profile>) => {
    const { data } = await api.put("/upload/advanced-settings", payload);
    return data;
  },

  updateCustomers: async (customers: Customer[]) => {
    const { data } = await api.put<{ customers: Customer[]; message: string }>("/upload/customers", {
      customers,
    });
    return data;
  },

  sendInvoices: async (payload: { customerIds: string[]; batchId?: string }) => {
    const { data } = await api.post<{
      message: string;
      sentCount: number;
      failedCount: number;
      results: Array<{ customerId: string; status: "sent" | "failed"; invoiceNumber?: string; error?: string }>;
      failed: Array<{ customerId: string; status: "failed"; error: string }>;
    }>("/upload/send", payload);
    return data;
  },
};
