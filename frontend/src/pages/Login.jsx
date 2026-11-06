import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Cpu, MailX, RefreshCw } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";
import {
  authApi,
  getApiErrorMessage,
  getApiErrorCode,
} from "../api/client.js";
import { useAuth } from "../hooks/useAuth.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendState, setResendState] = useState(""); // "sending" | "sent" | ""
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
    if (error) setError("");
    if (emailNotVerified) setEmailNotVerified(false);
    if (resendState) setResendState("");
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!EMAIL_RE.test(form.email)) errors.email = "Enter a valid email address";
    if (!form.password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);
    setResendState("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authApi.login({ email: form.email, password: form.password });
      const data = res.data ?? {};

      // Signup still in progress? Backend returns a session but no verified user.
      if (data.needsEmailVerification) {
        setEmailNotVerified(true);
        setError(
          "Your account is not confirmed yet. Check your inbox for the verification email."
        );
        return;
      }

      const tokens = data?.tokens;
      if (tokens?.access_token) {
        login(tokens, { remember });
      } else {
        setError("Login response did not include a session token. Please try again.");
        return;
      }

      try {
        // Where were we heading before being routed to /login?
        let returnTo = location.state?.from;
        if (!returnTo) returnTo = sessionStorage.getItem("sdh_return_to") || null;
        sessionStorage.removeItem("sdh_return_to");
        navigate(returnTo || "/dashboard", { replace: true });
      } catch {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === "EMAIL_NOT_VERIFIED") {
        // Verified account gated on the confirmation email — offer a resend.
        setEmailNotVerified(true);
        setError(
          "Please verify your email address before logging in. Didn't get the email?"
        );
      } else {
        setError(getApiErrorMessage(err, "Invalid email or password."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendState === "sending") return;
    setResendState("sending");
    try {
      await authApi.resendVerification({ email: form.email });
      setResendState("sent");
    } catch (err) {
      setResendState("");
      setError(getApiErrorMessage(err, "Could not resend the verification email. Please try again."));
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
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400">Sign in to your account to continue</p>
        </div>

        <Card>
          <CardBody className="p-6 sm:p-8">
            {error && (
              <div role="alert" className="mb-6 p-4 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
                {resendState === "sent" && (
                  <div className="flex items-start gap-2 font-medium">
                    <span>
                      Verification email sent to <span className="text-slate-200">{form.email}</span>.
                      Please check your inbox and confirm, then sign in again.
                    </span>
                  </div>
                )}
                {emailNotVerified && resendState !== "sent" && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResend}
                    loading={resendState === "sending"}
                    aria-hidden={resendState === "sending"}
                    className="w-full"
                  >
                    <MailX className="w-4 h-4 mr-2" aria-hidden="true" />
                    Resend verification email
                  </Button>
                )}
                {resendState === "sent" && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    You can request a new email from here after checking your inbox.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input
                id="email"
                name="email"
                label="Email"
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={handleChange}
                error={fieldErrors.email}
                autoComplete="email"
                required
              />

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                  autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-navy-200 text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  />
                  <span className="text-sm text-slate-400">
                    Remember me
                    <span className="text-xs text-slate-500">
                      {" "}
                      {remember ? "(stays signed in on this device)" : "(this session only)"}
                    </span>
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Sign in
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
