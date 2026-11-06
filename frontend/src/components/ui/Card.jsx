import { forwardRef } from "react";

export const Card = forwardRef(({ children, className = "", ...rest }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-navy-200 bg-navy-100/50 shadow-sm transition-all hover:border-navy-300/80 ${className}`}
    {...rest}
  >
    {children}
  </div>
));

Card.displayName = "Card";

export default Card;

export const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-navy-200/50 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = "" }) => (
  <div className={`px-6 py-3 border-t border-navy-200/50 flex items-center justify-between gap-4 ${className}`}>
    {children}
  </div>
);