import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Cpu } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";
import { authApi, getApiErrorMessage } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
    if (error) setError("");
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!EMAIL_RE.test(form.email)) errors.email = "Enter a valid email address";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password)
      errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authApi.signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const data = res.data ?? {};

      // Backend explicitly requested email verification -> park the user on
      // the check-your-inbox page instead of routing into the app.
      if (data.needsEmailVerification) {
        navigate("/verify-email", {
          replace: true,
          state: { email: form.email },
        });
        return;
      }

      // Fully confirmed account: store the tokens and continue into the app.
      const tokens = data?.tokens;
      if (tokens?.access_token) {
        login(tokens, { remember: false });
      }

      navigate("/dashboard", {
        replace: true,
        state: {
          notice: {
            title: "Account created",
            body:
              "Your account is active and you are signed in. Welcome to Student DevOps Hub!",
          },
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Signup failed. Please try again."));
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
          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-slate-400">Start monitoring your projects in minutes</p>
        </div>

        <Card>
          <CardBody className="p-6 sm:p-8">
            {error && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input
                id="name"
                name="name"
                label="Full name (optional)"
                placeholder="Alex Student"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />

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
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                error={fieldErrors.confirmPassword}
                autoComplete="new-password"
                required
              />

              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
