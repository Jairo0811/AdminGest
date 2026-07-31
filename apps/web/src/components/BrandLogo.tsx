type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  inverse?: boolean;
};

export function BrandLogo({ compact = false, className = '' }: BrandLogoProps) {
  const src = compact ? '/brand/isotipo.svg' : '/brand/logo.svg';

  return (
    <img
      alt="AdminGest"
      className={`brand-logo ${compact ? 'brand-logo--compact' : ''} ${className}`.trim()}
      decoding="async"
      src={src}
    />
  );
}
