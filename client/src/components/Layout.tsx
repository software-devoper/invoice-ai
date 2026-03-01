import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FileText, Send, UserCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/upload", label: "Send & Upload", icon: Send },
  { to: "/generate", label: "Generate", icon: FileText },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen px-4 py-5 md:px-8">
      <header className="mx-auto mb-5 flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-6 py-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/82">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-900 dark:text-slate-100">Invoice Automation</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Welcome, {user?.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-5 md:grid-cols-[260px,1fr]">
        <aside className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/78">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-brand-500 text-white shadow-glass"
                        : "text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300",
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-[70vh] min-w-0 overflow-hidden rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur-xl md:p-6 dark:border-slate-700 dark:bg-slate-900/70">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
