import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import LoadingButton from "../components/LoadingButton";
import type { Profile } from "../types";
import { profileService } from "../services/profileService";
import { SERVER_ORIGIN } from "../services/api";

const initialProfile: Profile = {
  companyName: "",
  address: "",
  email: "",
  country: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  paymentEmail: "",
  logoUrl: "",
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const logoPreview = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    if (profile.logoUrl) return `${SERVER_ORIGIN}${profile.logoUrl}`;
    return "";
  }, [logoFile, profile.logoUrl]);

  useEffect(() => {
    return () => {
      if (logoFile) URL.revokeObjectURL(logoPreview);
    };
  }, [logoFile, logoPreview]);

  useEffect(() => {
    profileService
      .get()
      .then((data) => setProfile({ ...initialProfile, ...data }))
      .catch((err: unknown) =>
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to load profile."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    if (!profile.companyName || !profile.address || !profile.email) {
      setError("Company Name, Company Address, and Company Email are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => formData.append(key, value || ""));
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const data = await profileService.save(formData);
      setProfile({ ...initialProfile, ...data.profile });
      setLogoFile(null);
      setEditing(false);
      setMessage(data.message || "Profile saved.");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Saving profile failed."
      );
    } finally {
      setSaving(false);
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
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-bold text-brand-900 dark:text-slate-100">Company Profile</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Profile details are embedded into invoice PDFs automatically.</p>
        </div>
        {editing ? (
          <LoadingButton isLoading={saving} onClick={onSave}>
            Save
          </LoadingButton>
        ) : (
          <LoadingButton variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </LoadingButton>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { key: "companyName", label: "Company Name *" },
          { key: "address", label: "Company Address *" },
          { key: "email", label: "Company Email *" },
          { key: "country", label: "Country" },
          { key: "bankName", label: "Bank Name" },
          { key: "accountNumber", label: "Account Number" },
          { key: "ifsc", label: "IFSC Code" },
          { key: "paymentEmail", label: "Payment Email" },
        ].map((field) => (
          <label key={field.key} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {field.label}
            <input
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-slate-700 outline-none ring-brand-200 transition focus:ring disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
              disabled={!editing}
              value={profile[field.key as keyof Profile] || ""}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, [field.key]: event.target.value }))
              }
            />
          </label>
        ))}
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Company Logo
          <input
            type="file"
            accept="image/*"
            disabled={!editing}
            onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
          />
        </label>

        {logoPreview && (
          <img
            src={logoPreview}
            alt="Company logo preview"
            className="mt-3 h-20 rounded-lg border border-brand-200 bg-white object-contain p-2 dark:border-slate-600 dark:bg-slate-800"
          />
        )}
      </div>
    </GlassCard>
  );
};

export default ProfilePage;
