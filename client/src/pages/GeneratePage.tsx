import { useEffect, useState } from "react";
import GlassCard from "../components/GlassCard";
import LoadingButton from "../components/LoadingButton";
import type { InvoiceRecord } from "../types";
import { invoiceService } from "../services/invoiceService";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const GeneratePage = () => {
  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string>("");

  const load = async (fromButton = false) => {
    if (fromButton) setBusyKey("refresh");
    setLoading(true);
    setError("");
    try {
      const data = await invoiceService.listRecords();
      setRecords(data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to load invoice records."
      );
    } finally {
      setLoading(false);
      if (fromButton) setBusyKey("");
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const onDelete = async (customerId: string) => {
    setBusyKey(`delete-${customerId}`);
    try {
      await invoiceService.deleteRecord(customerId);
      setRecords((prev) => prev.filter((row) => row.customerId !== customerId));
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Delete failed."
      );
    } finally {
      setBusyKey("");
    }
  };

  const onExport = async (customerId: string, format: "csv" | "xlsx") => {
    setBusyKey(`export-${format}-${customerId}`);
    try {
      const { blob } = await invoiceService.exportRecord(customerId, format);
      downloadBlob(blob, `invoice-record-${customerId}.${format}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Export failed."
      );
    } finally {
      setBusyKey("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <GlassCard className="w-full min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-brand-900 dark:text-slate-100">Invoice Records Dashboard</h2>
          <LoadingButton
            onClick={() => load(true)}
            isLoading={busyKey === "refresh"}
            variant="secondary"
          >
            Refresh
          </LoadingButton>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
      </GlassCard>

      <GlassCard className="w-full min-w-0">
        <div className="w-full max-h-[65vh] overflow-x-auto overflow-y-auto">
          <table className="w-max min-w-full text-left text-sm">
            <thead className="bg-brand-50 text-brand-900 dark:bg-slate-800 dark:text-cyan-300">
              <tr>
                <th className="px-3 py-2">Customer ID</th>
                <th className="px-3 py-2">Customer Name</th>
                <th className="px-3 py-2">Customer Email</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.customerId} className="border-b border-brand-100 dark:border-slate-700">
                  <td className="whitespace-nowrap px-3 py-2">{record.customerId}</td>
                  <td className="whitespace-nowrap px-3 py-2">{record.customerName}</td>
                  <td className="whitespace-nowrap px-3 py-2">{record.customerEmail}</td>
                  <td className="whitespace-nowrap px-3 py-2">{record.product}</td>
                  <td className="whitespace-nowrap px-3 py-2">{record.quantity}</td>
                  <td className="whitespace-nowrap px-3 py-2">${record.price.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        record.status === "sent"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {record.status === "sent" ? "Sent" : "Unsent"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{new Date(record.date).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <LoadingButton
                        isLoading={busyKey === `delete-${record.customerId}`}
                        onClick={() => onDelete(record.customerId)}
                        variant="danger"
                      >
                        Delete
                      </LoadingButton>
                      <LoadingButton
                        isLoading={busyKey === `export-csv-${record.customerId}`}
                        onClick={() => onExport(record.customerId, "csv")}
                        variant="secondary"
                      >
                        Export CSV
                      </LoadingButton>
                      <LoadingButton
                        isLoading={busyKey === `export-xlsx-${record.customerId}`}
                        onClick={() => onExport(record.customerId, "xlsx")}
                        variant="secondary"
                      >
                        Export Excel
                      </LoadingButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default GeneratePage;
