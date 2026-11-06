import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Button from "./ui/Button.jsx";

// Catches render errors anywhere below the routed tree and shows a friendly
// fallback instead of a blank screen.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error caught by ErrorBoundary:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/dashboard";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-navy-50 text-slate-200">
        <div className="max-w-md w-full text-center p-10 rounded-2xl border border-navy-200 bg-navy-100/50">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-warning-500/10 flex items-center justify-center text-warning-400">
            <AlertTriangle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-slate-400 text-sm mb-6">
            An unexpected error occurred while rendering this page. Your work elsewhere is safe —
            try returning to the dashboard.
          </p>
          <Button variant="primary" onClick={this.handleReset} className="inline-flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }
}
