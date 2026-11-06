const statusStyles = {
  pending: "bg-warning-500/10 text-warning-400 border-warning-500/20",
  running: "bg-primary-500/10 text-primary-300 border-primary-500/20",
  success: "bg-success-500/10 text-success-400 border-success-500/20",
  passed: "bg-success-500/10 text-success-400 border-success-500/20",
  failed: "bg-error-500/10 text-error-400 border-error-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  in_progress: "bg-primary-500/10 text-primary-300 border-primary-500/20",
  archived: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  paused: "bg-warning-500/10 text-warning-400 border-warning-500/20",
  active: "bg-success-500/10 text-success-400 border-success-500/20",
};

export default function Badge({ status, label, className = "", variant = "status" }) {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider shadow-sm";

  if (variant === "status") {
    return (
      <span className={`${base} ${statusStyles[status] || statusStyles.pending} ${className}`}>
        {label ?? status}
      </span>
    );
  }

  return <span className={`${base} bg-navy-200 text-slate-400 border-navy-200 ${className}`}>{label}</span>;
}