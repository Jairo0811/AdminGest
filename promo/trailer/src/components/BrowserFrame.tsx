import { colors, fonts } from '../theme';

/** Neutral application window (no URL bar: the trailer does not claim a live public service). */
export const BrowserFrame: React.FC<{
  width: number;
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}> = ({ width, children, title = 'AdminGest', style }) => (
  <div
    style={{
      width,
      borderRadius: 18,
      overflow: 'hidden',
      background: '#0a1726',
      border: '1px solid rgba(159,179,198,0.22)',
      boxShadow:
        '0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,211,238,0.08), 0 0 60px rgba(0,126,225,0.22)',
      ...style,
    }}
  >
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '0 18px',
        background: 'linear-gradient(#13263a, #0f2133)',
        borderBottom: '1px solid rgba(159,179,198,0.14)',
      }}
    >
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <span
          key={c}
          style={{ width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.85 }}
        />
      ))}
      <span
        style={{
          marginLeft: 14,
          fontFamily: fonts.body,
          fontWeight: 500,
          fontSize: 16,
          color: colors.muted,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </span>
    </div>
    {children}
  </div>
);
