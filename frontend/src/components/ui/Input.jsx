export default function Input({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  onInput,
  options = [],
  placeholder,
  error,
  required,
  after,
  className = "",
  wrapperClassName = "",
  ...rest
}) {
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className={wrapperClassName}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-400 mb-1.5 tracking-wide"
        >
          {label} {required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      {type === "select" ? (
        <select
          id={id}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          aria-describedby={describedBy}
          className={`block w-full px-4 py-3 rounded-lg border bg-navy-50/30 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-navy-50/10 disabled:text-slate-500 disabled:cursor-not-allowed ${error ? "border-error-500/60 focus:border-error-500" : "border-navy-200"} ${className}`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          onInput={onInput}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`block w-full px-4 py-3 rounded-lg border bg-navy-50/30 text-slate-100 placeholder-slate-500/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-navy-50/10 disabled:text-slate-500 disabled:cursor-not-allowed ${error ? "border-error-500/60 focus:border-error-500" : "border-navy-200"} ${className}`}
          {...rest}
        />
      )}

      {after}
      {error && (
        <p id={describedBy} className="mt-1 text-xs text-error-400 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
