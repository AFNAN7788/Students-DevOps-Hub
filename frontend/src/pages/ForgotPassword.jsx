import { useState } from "react";
import { Link } from "react-router-dom";
import { Cpu, Mail, AlertCircle, MailCheck } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";
import { authApi, getApiErrorMessage } from "../api/client.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setFieldError("Email is required");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setFieldError("Enter a valid email address");
      return;
    }
    setFieldError("");

    setLoading(true);
    try {
      await authApi.requestPasswordReset({ email });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit the request. Please try again."));
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
          <h1 className="text-2xl font-bold text-white mb-2">Forgot your password?</h1>
          <p className="text-slate-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <Card>
          <CardBody className="p-6 sm:p-8">
            {success ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success-500/10 flex items-center justify-center text-success-400">
                  <MailCheck className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Check your inbox</h2>
                <p className="text-sm text-slate-400 mb-6">
                  If an account exists for <span className="text-slate-200 font-medium">{email}</span>,
                  a password reset link is on its way.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Back to sign in
                  </Button>
                </Link>
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

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldError) setFieldError("");
                      }}
                      error={fieldError}
                      autoComplete="email"
                      required
                    />
                    <Mail
                      className="absolute right-4 top-[38px] w-4 h-4 text-slate-500"
                      aria-hidden="true"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full" loading={loading}>
                    Send reset link
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-400">
                    Remembered it?{" "}
                    <Link
                      to="/login"
                      className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                    >
                      Sign in
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
