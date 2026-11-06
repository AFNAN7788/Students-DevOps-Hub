import { forwardRef, cloneElement, Children } from "react";

const variants = {
  primary:
    "bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-primary-500/25 hover:bg-primary-700 hover:shadow-primary-500/35 transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
  secondary:
    "bg-navy-100 text-slate-300 px-4 py-2.5 rounded-lg font-medium hover:bg-navy-150 hover:text-white transition-colors active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/50 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
  outline:
    "border border-navy-200 text-slate-300 px-4 py-2.5 rounded-lg font-medium hover:bg-navy-100/50 hover:text-white hover:border-navy-300 transition-colors active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
  ghost:
    "text-slate-400 px-4 py-2.5 rounded-lg font-medium hover:bg-navy-100 hover:text-white transition-colors active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
  danger:
    "bg-error-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-error-500/20 hover:bg-error-700 hover:shadow-error-500/30 transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-error-500/50 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
  success:
    "bg-success-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-success-500/25 hover:bg-success-700 hover:shadow-success-500/35 transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-success-500/50 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef(
  (
    { children, variant = "primary", size = "md", disabled, loading, asChild, className = "", type = "button", ...rest },
    ref
  ) => {
    const base = variants[variant] || variants.primary;
    const classes = `${base} ${sizeClasses[size]} ${className}`;

    // asChild: apply the button styling to a single child element (e.g. react-router Link)
    // instead of rendering a nested <button>.
    if (asChild) {
      const child = Children.only(children);
      const childProps = {
        className: `${classes} ${child.props.className || ""}`,
        ...rest,
      };
      return cloneElement(child, childProps);
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={classes}
        {...rest}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
