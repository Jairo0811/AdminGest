import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { BrowserFrame } from '../components/BrowserFrame';
import { FeatureLayout, useViewport } from '../components/FeatureLayout';
import { Highlight, ScreenView } from '../components/ScreenView';
import { FeatureTitle } from '../components/Text';
import { useIsPortrait } from '../layout';
import { marks, wordAt } from '../time';

type SceneProps = { at: (s: number) => number; length: number };

/** Cross-fades between two screens inside the same window at frame `cut`. */
const Swap: React.FC<{ cut: number; a: React.ReactNode; b: React.ReactNode }> = ({ cut, a, b }) => {
  const frame = useCurrentFrame();
  const mix = interpolate(frame, [cut - 6, cut + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ opacity: 1 - mix }}>{a}</div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: mix,
          transform: `translateX(${(1 - mix) * 60}px)`,
        }}
      >
        {b}
      </div>
    </div>
  );
};

/** Two titles that replace each other at `cut` (same position). */
const TitleSwap: React.FC<{ cut: number; first: React.ReactNode; second: React.ReactNode }> = ({
  cut,
  first,
  second,
}) => {
  const frame = useCurrentFrame();
  return <div style={{ position: 'relative' }}>{frame < cut ? first : second}</div>;
};

/** Scene 4 — «Una plataforma diseñada para reunir lo que tu equipo necesita». Login → dashboard. */
export const Platform: React.FC<SceneProps> = ({ at, length }) => {
  const { width, height } = useViewport();
  const portrait = useIsPortrait();
  const cut = at(marks.loginToDashboard);
  return (
    <FeatureLayout
      length={length}
      title={
        <FeatureTitle
          eyebrow="Plataforma"
          title="Todo tu equipo, en un solo lugar"
          detail={portrait ? undefined : 'Acceso seguro y una vista ejecutiva de la operación.'}
          from={6}
        />
      }
    >
      <BrowserFrame width={width}>
        <Swap
          cut={cut}
          a={
            <ScreenView
              src="login-filled.webp"
              width={width}
              height={height}
              focus={[
                { at: 0, cx: portrait ? 0.77 : 0.5, cy: 0.5, zoom: 1 },
                { at: cut, cx: portrait ? 0.77 : 0.56, cy: 0.48, zoom: 1.06 },
              ]}
            />
          }
          b={
            <ScreenView
              src="dashboard.webp"
              width={width}
              height={height}
              focus={[
                { at: cut, cx: portrait ? 0.6 : 0.5, cy: 0.5, zoom: 1.05 },
                { at: length, cx: 0.59, cy: 0.38, zoom: 1.16 },
              ]}
            >
              <Highlight x={18.9} y={24.3} w={79.6} h={27.4} from={cut + 18} />
            </ScreenView>
          }
        />
      </BrowserFrame>
    </FeatureLayout>
  );
};

/** Scene 5 — «Organiza tus clientes. Da seguimiento a cada oportunidad». */
export const Crm: React.FC<SceneProps> = ({ at, length }) => {
  const { width, height } = useViewport();
  const cut = at(marks.customersToKanban);
  return (
    <FeatureLayout
      length={length}
      title={
        <TitleSwap
          cut={cut}
          first={
            <FeatureTitle
              eyebrow="CRM"
              title="Clientes organizados"
              detail="Contactos, RNC y estado de cada cuenta."
              from={at(wordAt('s5a', 'organiza')) - 6}
              to={cut}
            />
          }
          second={
            <FeatureTitle
              eyebrow="Embudo comercial"
              title="Cada oportunidad, en su etapa"
              detail="Kanban por etapa, valor y probabilidad."
              from={cut}
            />
          }
        />
      }
    >
      <BrowserFrame width={width}>
        <Swap
          cut={cut}
          a={
            <ScreenView
              src="customers.webp"
              width={width}
              height={height}
              focus={[
                { at: 0, cx: 0.56, cy: 0.45, zoom: 1.05 },
                { at: cut, cx: 0.48, cy: 0.52, zoom: 1.5 },
              ]}
            >
              <Highlight
                x={19.4}
                y={37.3}
                w={77.4}
                h={6.6}
                from={at(wordAt('s5a', 'clientes'))}
                to={cut}
              />
            </ScreenView>
          }
          b={
            <ScreenView
              src="opportunities-kanban.webp"
              width={width}
              height={height}
              focus={[
                { at: cut, cx: 0.5, cy: 0.45, zoom: 1.1 },
                { at: length, cx: 0.62, cy: 0.5, zoom: 1.55 },
              ]}
            >
              <Highlight
                x={55.5}
                y={30.5}
                w={17.6}
                h={15.6}
                from={at(wordAt('s5b', 'oportunidad')) - 4}
                color="#15d26d"
              />
            </ScreenView>
          }
        />
      </BrowserFrame>
    </FeatureLayout>
  );
};

/** Scene 6 — «Crea cotizaciones precisas. Planifica proyectos y tareas». */
export const QuotesProjects: React.FC<SceneProps> = ({ at, length }) => {
  const frame = useCurrentFrame();
  const { width, height } = useViewport();
  const portrait = useIsPortrait();
  const cut = at(marks.quoteToGantt);
  const docW = portrait ? 860 : 720;
  const docH = portrait ? 980 : 760;
  const tilt = interpolate(frame, [0, cut], [-4, 2], { extrapolateRight: 'clamp' });
  const quote = (
    <div
      style={{
        width,
        height: height + 40,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `rotate(${tilt}deg)`,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 40px 90px rgba(0,0,0,0.55), 0 0 60px rgba(21,210,109,0.18)',
        }}
      >
        <ScreenView
          src="quote-document.webp"
          imageWidth={1920}
          imageHeight={2380}
          width={docW}
          height={docH}
          focus={[
            { at: 0, cx: 0.5, cy: 0.25, zoom: 1 },
            { at: at(wordAt('s6a', 'cotizaciones')), cx: 0.5, cy: 0.42, zoom: 1.12 },
            { at: at(wordAt('s6a', 'precisas')) + 4, cx: 0.79, cy: 0.61, zoom: 1.75 },
            { at: cut - 2, cx: 0.84, cy: 0.74, zoom: 1.85 },
          ]}
        >
          <Highlight
            x={3.4}
            y={34.8}
            w={93.2}
            h={13.6}
            from={at(wordAt('s6a', 'cotizaciones'))}
            to={at(wordAt('s6a', 'precisas'))}
          />
          <Highlight
            x={61.8}
            y={49.6}
            w={34.8}
            h={23.4}
            from={at(wordAt('s6a', 'precisas'))}
            to={cut - 14}
            color="#15d26d"
          />
          <Highlight x={81.2} y={72.6} w={13.8} h={14.4} from={cut - 16} to={cut + 4} />
        </ScreenView>
      </div>
    </div>
  );
  const gantt = (
    <BrowserFrame width={width}>
      <ScreenView
        src="projects-gantt.webp"
        width={width}
        height={height}
        focus={[
          { at: cut, cx: 0.5, cy: 0.42, zoom: 1.1 },
          { at: length, cx: 0.62, cy: 0.42, zoom: 1.45 },
        ]}
      >
        <Highlight x={36.5} y={22} w={60} h={7.4} from={at(wordAt('s6b', 'proyectos'))} />
      </ScreenView>
    </BrowserFrame>
  );
  return (
    <FeatureLayout
      length={length}
      title={
        <TitleSwap
          cut={cut}
          first={
            <FeatureTitle
              eyebrow="Cotizaciones"
              title="Precisas, con ITBIS"
              detail="Descuentos, ITBIS por línea y verificación por QR."
              from={at(wordAt('s6a', 'crea')) - 6}
              to={cut}
            />
          }
          second={
            <FeatureTitle
              eyebrow="Proyectos"
              title="Planifica proyectos y tareas"
              detail="Cronograma con fechas, avance y responsables."
              from={cut}
            />
          }
        />
      }
    >
      <Swap cut={cut} a={quote} b={gantt} />
    </FeatureLayout>
  );
};

/** Scene 7 — «Consulta tus reportes y toma decisiones con más contexto». */
export const Reports: React.FC<SceneProps> = ({ at, length }) => {
  const { width, height } = useViewport();
  const decide = at(wordAt('s7', 'decisiones'));
  return (
    <FeatureLayout
      length={length}
      title={
        <FeatureTitle
          eyebrow="Reportes"
          title="Decisiones con más contexto"
          detail="Evolución comercial y embudo por etapa, exportables a Excel y PDF."
          from={at(wordAt('s7', 'consulta')) - 6}
        />
      }
    >
      <BrowserFrame width={width}>
        <ScreenView
          src="dashboard-scrolled.webp"
          width={width}
          height={height}
          focus={[
            { at: 0, cx: 0.45, cy: 0.3, zoom: 1.35 },
            { at: decide - 6, cx: 0.42, cy: 0.27, zoom: 1.6 },
            { at: length, cx: 0.8, cy: 0.45, zoom: 1.6 },
          ]}
        >
          <Highlight x={68.5} y={1.5} w={30} h={89} from={decide} color="#15d26d" />
        </ScreenView>
      </BrowserFrame>
    </FeatureLayout>
  );
};

/** Scene 8 — «Todo, desde una misma plataforma». A wall of real modules converges to the centre. */
const WALL = [
  'dashboard',
  'customers',
  'opportunities-kanban',
  'quotes',
  'projects-gantt',
  'reports',
  'leads',
  'users',
  'workflows',
];

export const Unified: React.FC<SceneProps> = ({ at, length }) => {
  const frame = useCurrentFrame();
  const portrait = useIsPortrait();
  const cols = portrait ? 2 : 3;
  const tiles = portrait ? WALL.slice(0, 8) : WALL;
  const tileW = portrait ? 470 : 560;
  const tileH = (tileW * 9) / 16;
  const gap = 26;
  const pull = interpolate(frame, [0, length], [1.18, 0.92], { easing: Easing.out(Easing.cubic) });
  const converge = interpolate(frame, [length - 26, length], [0, 1], {
    extrapolateLeft: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const rows = Math.ceil(tiles.length / cols);
  const label = at(wordAt('s8', 'misma')) - 4;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: 1600 }}>
      <div
        style={{
          transform: `rotateX(${portrait ? 10 : 14}deg) rotateZ(${portrait ? 0 : -3}deg) scale(${pull * (1 - 0.55 * converge)})`,
          opacity: 1 - converge,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${tileW}px)`,
          gap,
        }}
      >
        {tiles.map((src, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const dx = (c - (cols - 1) / 2) * (tileW + gap);
          const dy = (r - (rows - 1) / 2) * (tileH + gap);
          const delay = (Math.abs(c - (cols - 1) / 2) + Math.abs(r - (rows - 1) / 2)) * 3;
          const enter = interpolate(frame, [delay, delay + 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          return (
            <div
              key={src}
              style={{
                transform: `translate(${-dx * converge}px, ${-dy * converge}px) scale(${0.85 + 0.15 * enter})`,
                opacity: enter,
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid rgba(159,179,198,0.25)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
            >
              <ScreenView
                src={`${src}.webp`}
                width={tileW}
                height={tileH}
                focus={[{ at: 0, cx: 0.5, cy: 0.5, zoom: 1 }]}
              />
            </div>
          );
        })}
      </div>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: portrait ? 120 : 40,
        }}
      >
        <div
          style={{
            opacity: interpolate(
              frame,
              [label, label + 12, length - 14, length - 4],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            ),
            padding: portrait ? '22px 40px' : '20px 44px',
            borderRadius: 20,
            background: 'rgba(5,13,24,0.8)',
            border: '1px solid rgba(34,211,238,0.45)',
            boxShadow: '0 0 50px rgba(0,126,225,0.35)',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: portrait ? 64 : 62,
            color: '#f4f8fc',
            textAlign: 'center',
          }}
        >
          Una sola plataforma
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
