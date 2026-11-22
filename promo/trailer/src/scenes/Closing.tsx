import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Logo } from '../components/Logo';
import { Reveal } from '../components/Text';
import { useIsPortrait } from '../layout';
import { colors, fonts } from '../theme';
import { marks } from '../time';

/** Scene 9 — «AdminGest…» [logo] «Gestión Empresarial Inteligente». */
export const Closing: React.FC<{ at: (s: number) => number; length: number }> = ({
  at,
  length,
}) => {
  const frame = useCurrentFrame();
  const portrait = useIsPortrait();
  const logoAt = at(marks.finalLogo);
  const burst = interpolate(frame, [logoAt - 3, logoAt + 3, logoAt + 40], [0, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [length - 18, length], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(34,211,238,${burst}), transparent 50%)`,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: portrait ? 36 : 22,
          paddingBottom: portrait ? 120 : 40,
        }}
      >
        <Logo from={logoAt} height={portrait ? 560 : 470} />
        <Reveal from={at(marks.tagline) - 2} distance={30}>
          <div
            style={{
              fontFamily: fonts.heading,
              fontWeight: 700,
              fontSize: portrait ? 62 : 58,
              letterSpacing: portrait ? 1 : 2,
              color: colors.white,
              textAlign: 'center',
              lineHeight: 1.15,
            }}
          >
            Gestión Empresarial <span style={{ color: colors.green }}>Inteligente</span>
          </div>
        </Reveal>
        <Reveal from={at(marks.versionLine)} distance={16}>
          <div
            style={{
              display: 'grid',
              gap: 10,
              justifyItems: 'center',
              marginTop: portrait ? 30 : 16,
            }}
          >
            <div
              style={{
                fontFamily: fonts.body,
                fontWeight: 500,
                fontSize: portrait ? 32 : 26,
                letterSpacing: 1,
                color: colors.muted,
              }}
            >
              Versión 1.2.0 &nbsp;|&nbsp; Despliegue en desarrollo
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontWeight: 500,
                fontSize: portrait ? 30 : 24,
                letterSpacing: 1.5,
                color: colors.cyan,
                opacity: 0.85,
              }}
            >
              admingest.pages.dev
            </div>
          </div>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
