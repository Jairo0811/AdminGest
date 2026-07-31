type BrandLogoVariant = "login" | "sidebar" | "loader";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  compact?: boolean;
  className?: string;
};

export function BrandLogo({
  variant = "sidebar",
  compact = false,
  className = "",
}: BrandLogoProps) {
  const imageSource = compact
    ? "/brand/isotipo.png"
    : "/brand/logo.png";

  return (
    <span
      className={[
        "brand-logo",
        `brand-logo--${variant}`,
        compact ? "brand-logo--compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={imageSource}
        alt="AdminGest"
        className="brand-logo__image"
      />
    </span>
  );
}
