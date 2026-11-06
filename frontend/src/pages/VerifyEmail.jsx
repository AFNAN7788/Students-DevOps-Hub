import { Link } from "react-router-dom";
import { Cpu, MailCheck, Inbox, Sparkles } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";

// "Check your inbox" pending page — shown after signup flows that require
// email confirmation. Purely informational; no fabricated verification state.
export default function VerifyEmail() {
  const steps = [
    "Open your email client and look for a message from Student DevOps Hub.",
    "Click the confirmation link — it usually expires after a short time.",
    "Can't find it? Check your spam or junk folder.",
    "Still nothing? Return to the login page and try signing in; you can resend the confirmation from there.",
  ];

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
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400">
            <MailCheck className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
          <p className="text-slate-400">
            A confirmation email may be required before your account is fully active.
          </p>
        </div>

        <Card>
          <CardBody className="p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              What to do next
            </h2>
            <ol className="space-y-3 mb-6">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/10 text-primary-300 text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="p-3 rounded-lg bg-navy-100/50 border border-navy-200 text-xs text-slate-400 flex items-start gap-2 mb-6">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary-400" aria-hidden="true" />
              <span>
                The verification email is sent by our backend via Supabase. If it has not arrived
                within a few minutes, request a new one from the login page.
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  <Inbox className="w-4 h-4 mr-2" aria-hidden="true" />
                  Back to sign in
                </Button>
              </Link>
              <p className="text-xs text-center text-slate-500">
                Wrong address?{" "}
                <Link to="/signup" className="text-primary-400 hover:text-primary-300">
                  Sign up again
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
