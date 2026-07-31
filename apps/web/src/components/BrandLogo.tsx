type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  inverse?: boolean;
};

export function BrandLogo({ compact = false, className = '', inverse = false }: BrandLogoProps) {
  const textColor = inverse ? '#ffffff' : '#102238';

  return (
    <span
      aria-label="AdminGest"
      className={`brand-logo ${compact ? 'brand-logo--compact' : ''} ${className}`.trim()}
      role="img"
    >
      <svg
        aria-hidden="true"
        className="brand-logo__symbol"
        viewBox="0 0 96 84"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="adminGestBlue" x1="12" x2="58" y1="68" y2="8" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1267d5" />
            <stop offset="1" stopColor="#36a7ff" />
          </linearGradient>
          <linearGradient id="adminGestGreen" x1="38" x2="91" y1="73" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0ca85f" />
            <stop offset="1" stopColor="#43e07e" />
          </linearGradient>
        </defs>

        <path
          d="M8 70 37 10c2.2-4.7 8.8-4.7 11 0l24 49H59L43 25 27 59h16l6 11H8Z"
          fill="url(#adminGestBlue)"
        />
        <path
          d="M84 29c-6.4-8.5-16.5-13.7-27.5-13.7-3.2 0-6.4.4-9.3 1.3l6.1 12.5c1.1-.2 2.2-.3 3.4-.3 8.3 0 15.6 4.9 18.9 11.9H59.2v12.1h25.1c-1.5 10.4-10.3 18.4-21.1 18.4-7.8 0-14.6-4.1-18.4-10.3L36 70.2C42.1 79 52 84 63.2 84 81.3 84 96 69.3 96 51.2c0-8.3-3.1-15.9-8.2-21.6L84 29Z"
          fill="url(#adminGestGreen)"
          transform="translate(-2 -4) scale(.95)"
        />
        <path d="M34 70h8V56h-8v14Zm11 0h8V48h-8v22Zm11 0h8V39h-8v31Z" fill="#32d775" />
        <path d="m36 52 12-10 8 5 15-16" fill="none" stroke="#55ec8e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        <path d="m65 30 9-2-2 9" fill="none" stroke="#55ec8e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      </svg>

      {!compact && (
        <span className="brand-logo__wordmark" style={{ color: textColor }}>
          Admin<span>Gest</span>
        </span>
      )}
    </span>
  );
}
