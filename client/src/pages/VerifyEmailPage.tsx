import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { authService } from "../services/authService";

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      setMessage("Verification token is missing.");
      return;
    }

    authService
      .verifyEmail(token)
      .then((data) => {
        setState("success");
        setMessage(data.message || "Email verified successfully.");
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Verification failed."
        );
      });
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="w-full max-w-md text-center">
        {state === "loading" && (
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        )}
        <h1 className="font-heading text-2xl font-bold text-brand-900 dark:text-slate-100">Email Verification</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <Link
          className="mt-6 inline-flex rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          to="/auth"
        >
          Go to Login
        </Link>
      </GlassCard>
    </div>
  );
};

export default VerifyEmailPage;
