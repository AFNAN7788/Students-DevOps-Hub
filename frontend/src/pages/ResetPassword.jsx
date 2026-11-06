import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Eye, EyeOff, AlertCircle, CheckCircle2, Info } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";
import { authApi, getApiErrorMessage, storeSession } from "../api/client.js";

// Supabase recovery links redirect here as:
//   CLIENT_URL/reset-password#access_token=<jwt>&refresh_token=<token>
// Both tokens live in the URL *hash* fragment (not the query string).
function readRecoveryTokens() {
  try {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const access_token = params.get("access_token") || "";
    const refresh_token = params.get("refresh_token") || "";
    if (access_token && refresh_token) return { access_token, refresh_token };
    return null;
  } catch {
    return null;
  }
}

export default function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const recovery = readRecoveryTokens();
  const hasRecoverySession = Boolean(recovery);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
    if (error) setError("");
  };

  const validate = () => {
    const errors = {};
    if (!form.password) errors.password = "A new password is required";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    if (!recovery) return;

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        password: form.password,
        access_token: recovery.access_token,
        refresh_token: recovery.refresh_token,
      });
      setSuccess(true);
      // The backend rotates/ends this session; go in cleanly with the new password.
      const data = res?.data;
      if (data?.tokens?.access_token) {
        storeSession(data.tokens, { remember: true });
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reset the password. The link may have expired — request a new one."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-navy-50 text-slate-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
              <Cpu className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              Student<span className="text-primary-400">DevOps</span> Hub
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Set a new password</h1>
          <p className="text-slate-400">Choose a strong password for your account</p>
        </div>

        <Card>
          <CardBody className="p-6 sm:p-8">
            {!hasRecoverySession ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400">
                  <Info className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Open this page from your email</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Password resets are confirmed by a one-time link — we did not find one in this
                  address, so there is nothing to reset yet.
                </p>
                <Link to="/forgot-password">
                  <Button variant="primary" className="w-full">
                    Request a reset email
                  </Button>
                </Link>
              </div>
            ) : success ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success-500/10 flex items-center justify-center text-success-400">
                  <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Password updated</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Your password has been changed. Sign in with your new password to continue.
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate("/login", { replace: true })}
                >
                  Go to sign in
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    role="alert"
                    className="mb-6 p-4 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mb-6 p-3 rounded-lg bg-primary-500/5 border border-primary-500/20 text-primary-300 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Your recovery link was validated and we are ready to set a new password for
                    your account.
                  </span>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      label="New password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={handleChange}
                      error={fieldErrors.password}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-[34px] text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm new password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={fieldErrors.confirmPassword}
                    autoComplete="new-password"
                    required
                  />

                  <Button type="submit" variant="primary" className="w-full" loading={loading}>
                    Reset password
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-400">
                    Need another link?{" "}
                    <Link
                      to="/forgot-password"
                      className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                    >
                      Request a reset
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
