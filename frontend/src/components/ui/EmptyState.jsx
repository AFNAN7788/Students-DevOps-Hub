export default function EmptyState({
  icon = "inbox",
  title = "No data",
  description = "There is nothing to show here.",
  action,
  className = "",
}) {
  return (
    <div className={`text-center py-16 px-4 ${className}`}>
      <div className="w-16 h-16 mx-auto rounded-full bg-navy-100/50 border border-navy-200 flex items-center justify-center text-slate-500 mb-4 flex-shrink-0">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon === "inbox" && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          )}
        </svg>
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-slate-400 mb-6">{description}</p>
      {action && (
        <div className="flex justify-center gap-2">{action}</div>
      )}
    </div>
  );
}