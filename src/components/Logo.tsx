export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M11.5 23V9.5h10M11.5 16h7"
        fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="22" cy="22.5" r="2" fill="#fff" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
           <span
        className="text-lg font-semibold tracking-tight"
        style={{ fontFamily: "'Space Grotesk Variable', 'Inter Variable', sans-serif" }}
      >
        Focus<span className="text-primary">Flow</span>
      </span>
    </span>
  );
}