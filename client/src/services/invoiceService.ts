import { api } from "./api";
import type { InvoiceRecord } from "../types";

export const invoiceService = {
  listRecords: async () => {
    const { data } = await api.get<{ records: InvoiceRecord[] }>("/invoices/records");
    return data.records;
  },

  deleteRecord: async (customerId: string) => {
    const { data } = await api.delete(`/invoices/records/${customerId}`);
    return data;
  },

  exportRecord: async (customerId: string, format: "csv" | "xlsx") => {
    const { data, headers } = await api.get(`/invoices/records/${customerId}/export`, {
      params: { format },
      responseType: "blob",
    });
    return { blob: data as Blob, headers };
  },
};

