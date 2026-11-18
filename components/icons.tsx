type P = { className?: string; size?: number; color?: string };

export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
    <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-accent)" />
    <path d="M7 17h9v-6h3l2 3v3h-1" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="19" r="1.8" fill="#000" />
    <circle cx="19" cy="19" r="1.8" fill="#000" />
  </svg>
);

export const WhatsAppIcon = ({ size = 18, color = "#000" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const PinIcon = ({ size = 20, color = "#000" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="9.5" r="2.5" fill={color} />
  </svg>
);

export const ChevronDown = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 9l6 6 6-6" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowRight = ({ size = 18, color = "#000" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Check = ({ size = 18, label }: P & { label?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <circle cx="12" cy="12" r="10" fill="#000" />
    <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Star = ({ size = 24, filled = false, color = "#000" }: P & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"
      fill={filled ? color : "none"} stroke={color} strokeWidth="1.6" strokeLinejoin="round"
    />
  </svg>
);

export const TruckGlyph = ({ size = 18, color = "#000" }: P) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
    <path d="M5 17h10v-6h4l3 4v2h-1" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="19.5" r="2" fill={color} />
    <circle cx="19" cy="19.5" r="2" fill={color} />
  </svg>
);

export const Close = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
