import React from 'react';

type Props = {
  group: string;
  className?: string;
};

const UPPER_GROUPS = new Set([
  'Shoulders', 'Anterior - Deltoid', 'Rotator cuff', 'Chest', 'Lats', 'Trapezoid', 'Traps',
  'Biceps', 'Triceps', 'Forearms', 'Abs', 'Upper abs', 'Lower abs', 'Obliques', 'Lower back'
]);

const LOWER_GROUPS = new Set([
  'Glutes', 'Hips', 'Quadriceps', 'Hamstrings', 'Abductors', 'Calves', 'Shins'
]);

const resolveRegion = (group: string): 'upper' | 'lower' => (LOWER_GROUPS.has(group) ? 'lower' : 'upper');

const MuscleDiagram: React.FC<Props> = ({ group, className }) => {
  const region = resolveRegion(group);
  const isUpper = region === 'upper';
  const SCALE = isUpper ? 1.18 : 1.18;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden>
      <g transform={`translate(50 50) scale(${SCALE}) translate(-50 -50)`}>
        {/* Base outline */}
        {isUpper ? <UpperOutline /> : <LowerOutline />}

        {/* Contour lines */}
        {isUpper ? <UpperContours /> : <LowerContours />}

        {/* Highlight */}
        <g fill="currentColor" className="fill-current" opacity="0.8">
          {isUpper ? renderUpperHighlight(group) : renderLowerHighlight(group)}
        </g>
      </g>
    </svg>
  );
};

const strokeProps = { stroke: 'currentColor', strokeWidth: 3, fill: 'none', opacity: 0.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const faintProps = { stroke: 'currentColor', strokeWidth: 2, fill: 'none', opacity: 0.6 } as const;

function UpperOutline() {
  return (
    <g {...strokeProps}>
      {/* Head */}
      <circle cx="50" cy="12" r="8" />
      {/* Torso outline */}
      <path d="M28 24 C28 18, 40 18, 50 18 C60 18, 72 18, 72 24 C72 36, 68 46, 64 56 C60 66, 56 78, 50 86 C44 78, 40 66, 36 56 C32 46, 28 36, 28 24 Z" />
      {/* Arms outer curve (stylized) */}
      <path d="M28 28 C18 38, 18 56, 28 64" />
      <path d="M72 28 C82 38, 82 56, 72 64" />
    </g>
  );
}

function LowerOutline() {
  return (
    <g {...strokeProps}>
      {/* Pelvis */}
      <path d="M36 22 C40 18, 60 18, 64 22 C66 24, 66 30, 64 34 C60 40, 40 40, 36 34 C34 30, 34 24, 36 22 Z" />
      {/* Legs outline */}
      <path d="M44 40 C42 52, 40 72, 42 88 L48 88 C50 74, 52 54, 50 40 Z" />
      <path d="M56 40 C58 52, 60 72, 58 88 L52 88 C50 74, 48 54, 50 40 Z" />
      {/* Feet anchor */}
      <path d="M42 88 L48 92" />
      <path d="M58 88 L52 92" />
    </g>
  );
}

function UpperContours() {
  return (
    <g {...faintProps}>
      {/* Neck/traps */}
      <path d="M44 20 L56 20 L60 24 L40 24 Z" />
      {/* Chest split */}
      <path d="M30 34 C38 30, 62 30, 70 34" />
      {/* Sternum */}
      <path d="M50 30 L50 68" />
      {/* Ab grid */}
      <path d="M42 42 L58 42" />
      <path d="M42 54 L58 54" />
      <path d="M42 66 L58 66" />
      {/* Oblique lines */}
      <path d="M38 46 L44 64" />
      <path d="M62 46 L56 64" />
      {/* Lat contour */}
      <path d="M32 38 L36 54" />
      <path d="M68 38 L64 54" />
      {/* Arm segment hints */}
      <path d="M26 44 L30 58" />
      <path d="M74 44 L70 58" />
      {/* Shoulder caps */}
      <path d="M28 28 C32 26, 38 28, 42 32" />
      <path d="M72 28 C68 26, 62 28, 58 32" />
      {/* Bicep/tricep definition */}
      <path d="M28 42 C30 46, 30 52, 28 56" />
      <path d="M72 42 C70 46, 70 52, 72 56" />
      {/* Elbow markers */}
      <circle cx="28" cy="58" r="1" />
      <circle cx="72" cy="58" r="1" />
    </g>
  );
}

function LowerContours() {
  return (
    <g {...faintProps}>
      {/* Hip crease */}
      <path d="M38 36 C46 34, 54 34, 62 36" />
      {/* Thigh panels */}
      <path d="M44 40 L44 70" />
      <path d="M56 40 L56 70" />
      <path d="M40 52 L48 74" />
      <path d="M60 52 L52 74" />
      {/* Knee line */}
      <path d="M40 70 L60 70" />
      {/* Shin lines */}
      <path d="M46 72 L46 88" />
      <path d="M54 72 L54 88" />
      {/* Calf bulge */}
      <path d="M42 76 C44 84, 44 86, 46 88" />
      <path d="M58 76 C56 84, 56 86, 54 88" />
      {/* Ankle definition */}
      <circle cx="44" cy="86" r="1" />
      <circle cx="56" cy="86" r="1" />
      {/* Quad separation */}
      <path d="M42 42 C44 50, 44 60, 42 68" />
      <path d="M58 42 C56 50, 56 60, 58 68" />
    </g>
  );
}

function renderUpperHighlight(group: string) {
  switch (group) {
    case 'Chest':
      return <path d="M34 30 C42 26, 58 26, 66 30 L64 42 C56 40, 44 40, 36 42 Z" />;
    case 'Shoulders':
    case 'Rotator cuff':
    case 'Anterior - Deltoid':
      return (
        <>
          <path d="M26 26 C30 20, 38 20, 42 26 C40 32, 36 36, 32 36 C28 36, 26 32, 26 26 Z" />
          <path d="M74 26 C70 20, 62 20, 58 26 C60 32, 64 36, 68 36 C72 36, 74 32, 74 26 Z" />
        </>
      );
    case 'Biceps':
      return (
        <>
          <path d="M24 40 C26 36, 32 36, 34 40 L34 54 C30 56, 26 54, 24 50 Z" />
          <path d="M76 40 C74 36, 68 36, 66 40 L66 54 C70 56, 74 54, 76 50 Z" />
        </>
      );
    case 'Triceps':
      return (
        <>
          <path d="M24 38 C26 42, 32 42, 34 38 L34 52 C30 54, 26 52, 24 48 Z" />
          <path d="M76 38 C74 42, 68 42, 66 38 L66 52 C70 54, 74 52, 76 48 Z" />
        </>
      );
    case 'Forearms':
      return (
        <>
          <path d="M24 54 C26 58, 32 58, 34 56 L34 72 C30 74, 26 72, 24 68 Z" />
          <path d="M76 54 C74 58, 68 58, 66 56 L66 72 C70 74, 74 72, 76 68 Z" />
        </>
      );
    case 'Abs':
      return <path d="M42 38 C44 36, 56 36, 58 38 L58 68 C56 70, 44 70, 42 68 Z" />;
    case 'Upper abs':
      return <path d="M42 38 C44 36, 56 36, 58 38 L58 50 C56 52, 44 52, 42 50 Z" />;
    case 'Lower abs':
      return <path d="M42 52 C44 50, 56 50, 58 52 L58 68 C56 70, 44 70, 42 68 Z" />;
    case 'Obliques':
      return (
        <>
          <path d="M38 44 L46 66 C44 68, 38 66, 36 62 Z" />
          <path d="M62 44 L54 66 C56 68, 62 66, 64 62 Z" />
        </>
      );
    case 'Lower back':
      return <path d="M42 70 C44 68, 56 68, 58 70 L58 78 C56 80, 44 80, 42 78 Z" />;
    case 'Lats':
      return (
        <>
          <path d="M30 34 L42 48 C38 52, 32 50, 30 46 Z" />
          <path d="M70 34 L58 48 C62 52, 68 50, 70 46 Z" />
        </>
      );
    case 'Trapezoid':
    case 'Traps':
      return <path d="M38 20 L62 20 L68 28 L32 28 Z" />;
    default:
      return null;
  }
}

function renderLowerHighlight(group: string) {
  switch (group) {
    case 'Quadriceps':
      return (
        <>
          <path d="M40 38 C42 40, 44 50, 44 68 C42 70, 38 70, 36 66 C36 54, 38 44, 40 38 Z" />
          <path d="M60 38 C58 40, 56 50, 56 68 C58 70, 62 70, 64 66 C64 54, 62 44, 60 38 Z" />
        </>
      );
    case 'Hamstrings':
      return (
        <>
          <path d="M40 50 C42 54, 42 64, 42 76 C40 78, 38 78, 36 76 C36 64, 38 54, 40 50 Z" />
          <path d="M60 50 C58 54, 58 64, 58 76 C60 78, 62 78, 64 76 C64 64, 62 54, 60 50 Z" />
        </>
      );
    case 'Calves':
      return (
        <>
          <path d="M40 68 C42 74, 42 80, 44 82 C42 84, 40 84, 38 80 C38 74, 38 70, 40 68 Z" />
          <path d="M60 68 C58 74, 58 80, 56 82 C58 84, 60 84, 62 80 C62 74, 62 70, 60 68 Z" />
        </>
      );
    case 'Shins':
      return (
        <>
          <path d="M44 68 L44 84 L42 86 L42 68 Z" />
          <path d="M56 68 L56 84 L58 86 L58 68 Z" />
        </>
      );
    case 'Glutes':
      return <path d="M38 26 C42 22, 58 22, 62 26 C62 30, 58 34, 50 34 C42 34, 38 30, 38 26 Z" />;
    case 'Hips':
      return (
        <>
          <path d="M36 32 C38 30, 42 30, 44 32 C44 34, 42 36, 40 36 C38 36, 36 34, 36 32 Z" />
          <path d="M64 32 C62 30, 58 30, 56 32 C56 34, 58 36, 60 36 C62 36, 64 34, 64 32 Z" />
        </>
      );
    case 'Abductors':
      return (
        <>
          <path d="M34 42 C36 44, 38 50, 38 58 C36 60, 34 60, 32 56 C32 50, 32 46, 34 42 Z" />
          <path d="M66 42 C64 44, 62 50, 62 58 C64 60, 66 60, 68 56 C68 50, 68 46, 66 42 Z" />
        </>
      );
    default:
      return null;
  }
}

export default MuscleDiagram;
