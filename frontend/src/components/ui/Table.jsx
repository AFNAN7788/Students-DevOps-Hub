export default function Table({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-navy-200 bg-navy-100/50 overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export const TableHead = ({ children }) => (
  <thead className="bg-navy-100/30 border-b border-navy-200">{children}</thead>
);

export const TableRow = ({ children, className = "" }) => (
  <tr className={`border-b border-navy-200/50 text-left transition-colors hover:bg-navy-100/30 ${className}`}>
    {children}
  </tr>
);

export const TableHeader = ({ className = "", ...rest }) => (
  <th className={`px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${className}`} {...rest} />
);

export const TableBody = ({ children }) => <tbody>{children}</tbody>;

export const TableCell = ({ className = "", ...rest }) => (
  <td className={`px-6 py-4 text-sm text-slate-300 ${className}`} {...rest} />
);