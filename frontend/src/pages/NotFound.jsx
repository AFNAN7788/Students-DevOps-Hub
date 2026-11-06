import { Link, useLocation } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button.jsx";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
        <Compass className="w-8 h-8" aria-hidden="true" />
      </div>
      <p className="text-6xl font-bold text-white tracking-tight">404</p>
      <h1 className="text-xl font-semibold text-slate-200 mt-2 mb-2">Page not found</h1>
      <p className="text-slate-400 mb-8">
        We couldn&apos;t find <span className="font-mono text-slate-300 text-sm">{location.pathname}</span>.
        Maybe it moved, or maybe it never existed — either way, the dashboard is a good place to regroup.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back to dashboard
          </Button>
        </Link>
        <Link to="/projects">
          <Button variant="outline">View projects</Button>
        </Link>
      </div>
    </div>
  );
}
