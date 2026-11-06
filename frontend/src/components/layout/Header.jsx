import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Cpu,
  Database,
  Zap,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  LogIn,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Cpu },
  { path: "/projects", label: "Projects", icon: Database },
  { path: "/settings", label: "Settings", icon: Zap },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close the dropdown on Escape (keyboard operability) and on outside click.
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    const onClick = (e) => {
      const inTrigger = menuRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setUserMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await logout();
  };

  const displayName =
    user?.name || user?.email?.split("@")[0] || null;
  const displayEmail = user?.email || null;
  const initials = (user?.name || user?.email || "U")
    .split(/[\s@._-]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="fixed top-0 left-0 z-40 w-full border-b border-navy-200 bg-navy-100/80 backdrop-blur-md supports-[backdrop-filter]:bg-navy-100/60">
      <div className="flex items-center justify-between px-6 sm:px-8 h-16 md:h-20">
        {/* Logo / Brand */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
            <Cpu className="w-5 h-5 md:w-6 md:h-6 text-white" aria-hidden="true" />
          </div>
          <span className="font-bold text-xl md:text-2xl tracking-tight text-white">
            Student<span className="text-primary-400">DevOps</span> Hub
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isActive
                    ? "bg-primary-500/10 text-primary-300 border border-primary-500/20 shadow-sm shadow-primary-500/5"
                    : "text-slate-300 hover:text-white hover:bg-navy-100/50 border border-transparent"
                }`
              }
            >
              <item.icon className="w-4 h-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User controls */}
        <div className="flex items-center gap-2 md:gap-4" ref={menuRef}>
          {status === "anonymous" ? (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              Sign in
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label={user ? `Account menu for ${displayName}` : "Account menu"}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-200 text-slate-300 hover:bg-navy-250 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                  {user ? (
                    <span className="text-xs font-semibold">{initials}</span>
                  ) : (
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </div>
                <div className="hidden md:block text-left max-w-[160px]">
                  {user ? (
                    <>
                      <p className="text-sm font-medium text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
                    </>
                  ) : (
                    // Loading state while the session is verified — no fabricated user info
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      Loading session…
                    </p>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 ml-1" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-error-400 hover:bg-error-500/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/50"
              >
                <LogOut className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Sign out
              </button>
            </>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden px-3 py-2 rounded-lg text-slate-300 hover:bg-navy-200 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[50] flex flex-col bg-navy-100 md:hidden">
          <div className="px-6 py-4 border-b border-navy-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
                <Cpu className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Student<span className="text-primary-400">DevOps</span> Hub
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-200"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-6 space-y-2" aria-label="Mobile">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary-500/10 text-primary-300 border border-primary-500/20"
                      : "text-slate-300 hover:text-white hover:bg-navy-200/50"
                  }`
                }
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                <span>{item.label}</span>
                <ChevronRight className="ml-auto w-4 h-4 opacity-50" aria-hidden="true" />
              </NavLink>
            ))}
            <div className="pt-4 border-t border-navy-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-error-400 hover:bg-error-500/5 transition-colors rounded-lg"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* User dropdown menu */}
      {userMenuOpen && (
        <div
          ref={dropdownRef}
          role="menu"
          aria-label="Account menu"
          className="fixed top-16 right-4 z-[51] w-56 bg-navy-100 border border-navy-200 rounded-xl shadow-elevated-lg animate-fade-in overflow-hidden"
        >
          <div className="p-4 border-b border-navy-200">
            {user ? (
              <>
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Verifying session…</p>
            )}
          </div>
          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setUserMenuOpen(false);
                navigate("/settings");
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-navy-200 hover:text-white transition-colors rounded-lg"
            >
              Account settings
            </button>
            <hr className="my-1 border-navy-200" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-error-400 hover:bg-error-500/10 transition-colors rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2 inline" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
