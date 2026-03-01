import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import LoadingButton from "../components/LoadingButton";
import type { Customer, Profile } from "../types";
import { uploadService } from "../services/uploadService";
import { profileService } from "../services/profileService";

const initialAdvancedSettings = {
  country: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  paymentEmail: "",
};

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [batchId, setBatchId] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [failureReasons, setFailureReasons] = useState<Array<{ customerId: string; error: string }>>([]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingAdvanced, setEditingAdvanced] = useState(false);
  const [editingData, setEditingData] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState(initialAdvancedSettings);

  const [uploading, setUploading] = useState(false);
  const [savingAdvanced, setSavingAdvanced] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [sending, setSending] = useState(false);

  const hasData = customers.length > 0;

  useEffect(() => {
    profileService
      .get()
      .then((profile: Profile) => {
        setAdvancedSettings({
          country: profile.country || "",
          bankName: profile.bankName || "",
          accountNumber: profile.accountNumber || "",
          ifsc: profile.ifsc || "",
          paymentEmail: profile.paymentEmail || "",
        });
      })
      .catch(() => null);
  }, []);

  const totalAmount = useMemo(
    () => customers.reduce((sum, row) => sum + Number(row.quantity) * Number(row.price), 0),
    [customers]
  );

  const onUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage("");
    setError("");
    setFailureReasons([]);

    try {
      const data = await uploadService.parseFile(file);
      setCustomers(data.customers);
      setBatchId(data.batchId);
      setMessage(data.message || "File uploaded and validated.");
    } catch (err: unknown) {
      setCustomers([]);
      setBatchId("");
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const onSaveAdvanced = async () => {
    setSavingAdvanced(true);
    setMessage("");
    setError("");
    setFailureReasons([]);
    try {
      const data = await uploadService.saveAdvancedSettings(advancedSettings);
      setMessage(data.message || "Advanced settings saved.");
      setEditingAdvanced(false);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Saving advanced settings failed."
      );
    } finally {
      setSavingAdvanced(false);
    }
  };

  const onSaveData = async () => {
    setSavingData(true);
    setMessage("");
    setError("");
    setFailureReasons([]);
    try {
      const data = await uploadService.updateCustomers(customers);
      setCustomers(data.customers);
      setMessage(data.message || "Customer rows updated.");
      setEditingData(false);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Saving data edits failed."
      );
    } finally {
      setSavingData(false);
    }
  };

  const onSendInvoices = async () => {
    setSending(true);
    setMessage("");
    setError("");
    setFailureReasons([]);
    try {
      const data = await uploadService.sendInvoices({
        customerIds: customers.map((row) => row._id),
        batchId,
      });
      const failedIds = new Set((data.failed || []).map((item) => String(item.customerId)));

      if (data.failedCount > 0) {
        setFailureReasons((data.failed || []).map((item) => ({ customerId: item.customerId, error: item.error })));
        setError(
          `${data.message} Failed customers were kept in the table so you can correct and resend.`
        );
        setCustomers((prev) => prev.filter((row) => failedIds.has(String(row._id))));
      } else {
        setMessage(data.message || "Invoices sent.");
        setCustomers([]);
        setFile(null);
        setBatchId("");
        setShowAdvanced(false);
        setEditingData(false);
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Sending invoices failed."
      );
    } finally {
      setSending(false);
    }
  };

  const updateCustomer = <K extends keyof Customer>(index: number, key: K, value: Customer[K]) => {
    setCustomers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <GlassCard>
        <h2 className="font-heading text-xl font-bold text-brand-900 dark:text-slate-100">Send & Upload</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Upload Excel or CSV customer sales data to validate and prepare invoice generation.
        </p>

        <div className="mt-4 flex flex-col items-start gap-3 md:flex-row md:items-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-brand-700 md:max-w-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:file:bg-slate-700 dark:file:text-slate-100"
          />
          <LoadingButton isLoading={uploading} onClick={onUpload} disabled={!file}>
            Upload & Validate
          </LoadingButton>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
            {message}
          </p>
        )}
        {failureReasons.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-semibold">Failure details:</p>
            <ul className="mt-1 list-disc pl-5">
              {failureReasons.slice(0, 8).map((item) => (
                <li key={item.customerId}>
                  {item.customerId}: {item.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {hasData && (
        <GlassCard>
          <div className="flex flex-wrap items-center gap-2">
            <LoadingButton onClick={() => setShowAdvanced((prev) => !prev)} variant="secondary">
              {showAdvanced ? "Hide Advanced Settings" : "Advanced Settings"}
            </LoadingButton>
            <LoadingButton onClick={() => setEditingData((prev) => !prev)} variant="secondary">
              {editingData ? "Cancel Edit Data" : "Edit Data"}
            </LoadingButton>
            <LoadingButton isLoading={sending} onClick={onSendInvoices}>
              Send Invoices
            </LoadingButton>
          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Customers in current batch: <strong>{customers.length}</strong> | Estimated subtotal:{" "}
            <strong>${totalAmount.toFixed(2)}</strong>
          </p>
        </GlassCard>
      )}

      {hasData && showAdvanced && (
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-brand-900 dark:text-slate-100">Advanced Settings</h3>
            {editingAdvanced ? (
              <LoadingButton isLoading={savingAdvanced} onClick={onSaveAdvanced}>
                Save
              </LoadingButton>
            ) : (
              <LoadingButton onClick={() => setEditingAdvanced(true)} variant="secondary">
                Edit
              </LoadingButton>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(advancedSettings).map(([key, value]) => (
              <label key={key} className="text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
                {key}
                <input
                  className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-slate-700 outline-none ring-brand-200 transition focus:ring disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
                  disabled={!editingAdvanced}
                  value={value}
                  onChange={(event) =>
                    setAdvancedSettings((prev) => ({ ...prev, [key]: event.target.value }))
                  }
                />
              </label>
            ))}
          </div>
        </GlassCard>
      )}

      {hasData && (
        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-brand-900 dark:text-slate-100">Customer Sales Table</h3>
            {editingData && (
              <LoadingButton isLoading={savingData} onClick={onSaveData}>
                Save Changes
              </LoadingButton>
            )}
          </div>

          <div className="max-h-[58vh] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-50 text-brand-900 dark:bg-slate-800 dark:text-cyan-300">
                <tr>
                  <th className="px-3 py-2">Customer Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Quantity</th>
                  <th className="px-3 py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={customer._id} className="border-b border-brand-100 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded-md border border-brand-200 bg-white px-2 py-1 text-slate-700 disabled:border-transparent disabled:bg-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:text-slate-300"
                        disabled={!editingData}
                        value={customer.name}
                        onChange={(e) => updateCustomer(index, "name", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded-md border border-brand-200 bg-white px-2 py-1 text-slate-700 disabled:border-transparent disabled:bg-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:text-slate-300"
                        disabled={!editingData}
                        value={customer.email}
                        onChange={(e) => updateCustomer(index, "email", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded-md border border-brand-200 bg-white px-2 py-1 text-slate-700 disabled:border-transparent disabled:bg-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:text-slate-300"
                        disabled={!editingData}
                        value={customer.product}
                        onChange={(e) => updateCustomer(index, "product", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full rounded-md border border-brand-200 bg-white px-2 py-1 text-slate-700 disabled:border-transparent disabled:bg-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:text-slate-300"
                        disabled={!editingData}
                        value={customer.quantity}
                        onChange={(e) => updateCustomer(index, "quantity", Number(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full rounded-md border border-brand-200 bg-white px-2 py-1 text-slate-700 disabled:border-transparent disabled:bg-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:text-slate-300"
                        disabled={!editingData}
                        value={customer.price}
                        onChange={(e) => updateCustomer(index, "price", Number(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default UploadPage;
