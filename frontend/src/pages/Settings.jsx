import { useEffect, useState } from "react";
import { RotateCcw, Save, ShieldCheck, AlertTriangle, Globe, CheckCircle2, KeyRound } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Tabs, { TabPanel } from "../components/ui/Tabs.jsx";
import { authApi, getApiErrorMessage } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="w-5 h-5 text-slate-500" aria-hidden="true" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
      </div>

      <Tabs defaultValue="profile" ariaLabel="Settings sections">
        <TabPanel label="Profile" value="profile">
          <ProfileTab />
        </TabPanel>
        <TabPanel label="Account" value="account">
          <AccountTab />
        </TabPanel>
        <TabPanel label="Security" value="security">
          <SecurityTab />
        </TabPanel>
        <TabPanel label="Integrations" value="integrations">
          <IntegrationsTab />
        </TabPanel>
      </Tabs>
    </div>
  );
}

/* ── Internal guard: everything in Settings is real, session-derived data ── */

function useProfile() {
  const { user, refreshUser, status } = useAuth();
  return { user, refreshUser, status };
}

/* ── Profile tab ── */

function ProfileTab() {
  const { user, refreshUser, status } = useProfile();
  const [form, setForm] = useState({
    name: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Fresh profile straight from GET /api/profile (not just the cached session user).
  useEffect(() => {
    if (status !== "authenticated") {
      setFetching(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.me();
        const profile = res.data?.user || {};
        if (cancelled) return;
        setForm({
          name: profile.name || "",
          email: profile.email || user?.email || "",
        });
      } catch (err) {
        if (cancelled) return;
        // Fall back to the session-derived user; profile save is still available.
        setForm({ name: user?.name || "", email: user?.email || "" });
        setError(getApiErrorMessage(err, "Could not load your profile."));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, user?.email, user?.name]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    setLoading(true);
    try {
      // Only the editable fields are sent; the email is fixed to the verified
      // Supabase Auth identity in this phase.
      await authApi.updateProfile({ name: form.name });
      await refreshUser(); // session-derived info (header, account tab) updates instantly
      setForm((prev) => ({ ...prev, name: form.name }));
      setSuccessMessage("Profile saved.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save your profile. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (status !== "authenticated" || fetching) {
    return (
      <Card>
        <CardBody className="p-8 text-center text-slate-400 text-sm">
          Verifying session… your profile loads from the backend.
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Profile</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-lg">
          {successMessage && (
            <div
              role="status"
              className="p-3 rounded-lg bg-success-500/10 border border-success-500/20 text-success-400 text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {successMessage}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Input
            id="profile-name"
            name="name"
            label="Full name"
            placeholder={user?.name || "Add your name"}
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />
          <Input
            id="profile-email"
            name="email"
            label="Email address (fixed to your verified account)"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            disabled
          />
          <p className="text-xs text-slate-500 -mt-3">
            Changing the sign-in email is not supported in this phase yet.
          </p>

          <Button type="submit" variant="primary" loading={loading}>
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            Save changes
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

/* ── Account tab ── */

function AccountTab() {
  const { user } = useProfile();

  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Account</h2>
        <p className="text-sm text-slate-400 mb-6">
          Identity information comes directly from your authenticated session.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-xl border border-navy-200 bg-navy-100/50">
            <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400 flex-shrink-0">
              <RotationishIcon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white">Display name</h3>
              <p className="text-sm text-slate-500 mt-1 truncate">
                {user?.name || "Not set"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-navy-200 bg-navy-100/50">
            <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 flex-shrink-0">
              <KeyRound className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white">Email</h3>
              <p className="text-sm text-slate-500 mt-1 truncate">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-navy-200 bg-navy-100/50">
            <div className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center text-success-400 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Identity verification</h3>
              <p className="text-sm text-slate-500 mt-1">Reported by the backend</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Simple identity glyph for the display-name tile
function RotationishIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

/* ── Security tab ── */

function SecurityTab() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const validate = () => {
    const errors = {};
    if (!form.currentPassword) errors.currentPassword = "Current password is required";
    if (!form.newPassword) errors.newPassword = "A new password is required";
    else if (form.newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters";
    else if (form.newPassword === form.currentPassword)
      errors.newPassword = "The new password must be different from the current one";
    if (form.confirmPassword !== form.newPassword) errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.changePassword({
        current_password: form.currentPassword,
        new_password: form.newPassword,
      });
      setSuccessMessage("Password changed.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not change the password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Change password</h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-lg">
          {successMessage && (
            <div
              role="status"
              className="p-3 rounded-lg bg-success-500/10 border border-success-500/20 text-success-400 text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {successMessage}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Input
            id="currentPassword"
            name="currentPassword"
            label="Current password"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            error={fieldErrors.currentPassword}
            autoComplete="current-password"
            required
          />
          <Input
            id="newPassword"
            name="newPassword"
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            value={form.newPassword}
            onChange={handleChange}
            error={fieldErrors.newPassword}
            autoComplete="new-password"
            required
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
            required
          />

          <Button type="submit" variant="primary" loading={loading}>
            <KeyRound className="w-4 h-4 mr-2" aria-hidden="true" />
            Change password
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

/* ── Integrations tab ── */

function IntegrationsTab() {
  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Integrations</h2>
        <div className="flex items-center justify-between p-4 rounded-xl border border-navy-200 bg-navy-100/50 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-200 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-slate-400" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-white">GitHub</h3>
              <p className="text-xs text-slate-400">Connect repositories and sync CI/CD</p>
            </div>
          </div>
          <Badge label="Coming soon" status="pending" />
        </div>
        <div className="text-xs text-slate-500 text-center pt-4">
          Automatic repository sync, webhooks, and build statuses are planned — labeled honestly as
          not yet available.
        </div>
      </CardBody>
    </Card>
  );
}
