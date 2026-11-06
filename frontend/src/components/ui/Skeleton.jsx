export default function Skeleton({ className = "", ...rest }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-navy-100/50 ${className}`}
      {...rest}
    />
  );
}