import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import LoadingButton from "../components/LoadingButton";
import ThemeToggle from "../components/ThemeToggle";
import { authService } from "../services/authService";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

type Mode = "login" | "register";

const AuthPage = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "register") {
        const data = await authService.register({ username, email, password });
        setMessage(data.message || "Registered. Check your email for verification link.");
        setResendEmail(email);
        setMode("login");
      } else {
        const data = await authService.login({ username, password });
        login(data.token, data.user);
        navigate("/upload");
      }
    } catch (err: unknown) {
      const fallback = "Authentication request failed.";
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback);
    } finally {
      setLoading(false);
    }
  };

  const onResendVerification = async () => {
    if (!resendEmail) {
      setError("Please enter your email to resend verification.");
      return;
    }
    setResendLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/resend-verification", { email: resendEmail });
      setMessage(data.message || "Verification email request accepted.");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to resend verification email."
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="fixed right-4 top-4 z-30">
        <ThemeToggle compact />
      </div>
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.2fr,1fr]">
        <GlassCard className="relative overflow-hidden">
          <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-brand-200/60 blur-2xl dark:bg-slate-700/60" />
          <div className="relative space-y-4">
            <p className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100">
              AI Invoice Automation
            </p>
            <h1 className="font-heading text-4xl font-bold text-brand-900 dark:text-slate-100">New Invoice Automation Flow</h1>
            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
              Upload customer sales sheets, validate records, generate polished PDFs, and send invoices in one flow.
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 grid grid-cols-2 rounded-lg border border-brand-200 bg-brand-50 p-1 text-sm dark:border-slate-600 dark:bg-slate-800">
            <button
              className={`rounded-md border px-3 py-2 font-semibold transition ${
                mode === "login"
                  ? "border-brand-300 bg-white text-brand-700 shadow-sm dark:border-slate-400 dark:bg-slate-700 dark:text-slate-100"
                  : "border-transparent bg-brand-50 text-slate-700 hover:border-brand-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`rounded-md border px-3 py-2 font-semibold transition ${
                mode === "register"
                  ? "border-brand-300 bg-white text-brand-700 shadow-sm dark:border-slate-400 dark:bg-slate-700 dark:text-slate-100"
                  : "border-transparent bg-brand-50 text-slate-700 hover:border-brand-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
              }`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <form className="space-y-3" onSubmit={submit}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Username
              <input
                className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 outline-none ring-brand-200 transition focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            {mode === "register" && (
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 outline-none ring-brand-200 transition focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 outline-none ring-brand-200 transition focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                {message}
              </p>
            )}

            <LoadingButton type="submit" className="w-full" isLoading={loading}>
              {mode === "register" ? "Create Account" : "Login"}
            </LoadingButton>
          </form>

          {mode === "login" && (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-slate-600 dark:bg-slate-800">
              <p className="text-xs font-semibold text-brand-800 dark:text-slate-100">Didn&apos;t get verification email?</p>
              <div className="mt-2 flex flex-col gap-2 md:flex-row">
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-brand-200 transition focus:ring dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-500"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <LoadingButton
                  type="button"
                  variant="secondary"
                  isLoading={resendLoading}
                  onClick={onResendVerification}
                >
                  Resend
                </LoadingButton>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthPage;
