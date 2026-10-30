import React from 'react';

export type LogoConcept = 'precision' | 'shift' | 'piercer' | 'monogram' | 'velocity';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Concept 1: The Precision Dart
 * Geometric supersonic arrowhead with faceted shading. Clean, fast, and razor sharp.
 */
export const PrecisionDartLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="precision-grad-left" x1="16" y1="2" x2="2" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="precision-grad-right" x1="16" y1="2" x2="30" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
    </defs>
    {/* Left facet */}
    <path d="M16 2L3 27L16 21V2Z" fill="url(#precision-grad-left)" />
    {/* Right facet */}
    <path d="M16 2L29 27L16 21V2Z" fill="url(#precision-grad-right)" />
    {/* Center crease */}
    <line x1="16" y1="2" x2="16" y2="21" stroke="#047857" strokeWidth="1" strokeOpacity="0.4" />
  </svg>
);

/**
 * Concept 2: The Forward Shift
 * Stepped parallel isometric chevron arrows surging up and right at 45 degrees.
 */
export const ForwardShiftLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="shift-grad" x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#059669" />
        <stop offset="1" stopColor="#34d399" />
      </linearGradient>
    </defs>
    {/* Trailing chevron */}
    <path
      d="M5 21L14 12L17 15L11 21L17 27L14 30L5 21Z"
      fill="#059669"
      fillOpacity="0.4"
    />
    {/* Middle chevron */}
    <path
      d="M11 15L20 6L23 9L17 15L23 21L20 24L11 15Z"
      fill="#10b981"
      fillOpacity="0.75"
    />
    {/* Leading arrow head */}
    <path
      d="M17 9L26 0L29 3L23 9L29 15L26 18L17 9Z"
      fill="url(#shift-grad)"
      transform="translate(1, 4)"
    />
  </svg>
);

/**
 * Concept 3: The Cloud Piercer
 * A circular storage vault/loop pierced cleanly by an upward supersonic dart arrow.
 */
export const CloudPiercerLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="piercer-arrow-grad" x1="4" y1="28" x2="26" y2="6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#059669" />
        <stop offset="1" stopColor="#34d399" />
      </linearGradient>
    </defs>
    {/* Broken circular vault ring */}
    <path
      d="M14 6C8.47715 6 4 10.4772 4 16C4 21.5228 8.47715 26 14 26C19.5228 26 24 21.5228 24 16C24 14.5 23.6 13.1 22.9 11.8"
      stroke="#525252"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Piercing Arrow */}
    <path
      d="M7 25L26 6M26 6H17M26 6V15"
      stroke="url(#piercer-arrow-grad)"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Concept 4: The Monogram 'D' + Arrow
 * Capital letter 'D' where the negative space inside forms a forward-pointing speed arrow.
 */
export const MonogramDartLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="mono-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Outer D Shape with arrow cutout using evenodd rule */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 4C4 2.89543 4.89543 2 6 2H16C23.732 2 29 7.26801 29 16C29 24.732 23.732 30 16 30H6C4.89543 30 4 29.1046 4 28V4ZM11 9.5V22.5L22 16L11 9.5Z"
      fill="url(#mono-grad)"
    />
  </svg>
);

/**
 * Concept 5: The Velocity Flight
 * Sleek aerodynamic competition dart with angled stabilizing fletchings and sharp tip.
 */
export const VelocityDartLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="velocity-grad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Arrow Tip */}
    <path d="M16 2L22 12H10L16 2Z" fill="url(#velocity-grad)" />
    {/* Shaft */}
    <rect x="14.5" y="11" width="3" height="13" rx="0.5" fill="#10b981" />
    {/* Left Fletching Wing */}
    <path d="M14.5 17L8 23V28L14.5 24V17Z" fill="#059669" />
    {/* Right Fletching Wing */}
    <path d="M17.5 17L24 23V28L17.5 24V17Z" fill="#34d399" />
  </svg>
);

/**
 * Master Logo component rendering the selected concept
 */
export const DartLogo: React.FC<{ concept?: LogoConcept; className?: string; size?: number }> = ({
  concept = 'precision',
  className,
  size,
}) => {
  switch (concept) {
    case 'precision':
      return <PrecisionDartLogo className={className} size={size} />;
    case 'shift':
      return <ForwardShiftLogo className={className} size={size} />;
    case 'piercer':
      return <CloudPiercerLogo className={className} size={size} />;
    case 'monogram':
      return <MonogramDartLogo className={className} size={size} />;
    case 'velocity':
      return <VelocityDartLogo className={className} size={size} />;
    default:
      return <PrecisionDartLogo className={className} size={size} />;
  }
};

export const LOGO_CONCEPTS: {
  id: LogoConcept;
  name: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: 'precision',
    name: 'Concept 1: Precision Dart',
    tagline: 'Geometric & Minimalist',
    description: 'Razor-sharp aerodynamic arrowhead with dual-tone faceted lighting. Conveys high velocity, directness, and precision storage.',
  },
  {
    id: 'shift',
    name: 'Concept 2: Forward Shift',
    tagline: 'Isometric Motion',
    description: 'Triple layered chevron arrow bars in 45-degree isometric perspective, symbolizing cloud upload and instant transfer velocity.',
  },
  {
    id: 'piercer',
    name: 'Concept 3: Cloud Piercer',
    tagline: 'Storage Vault + Arrow',
    description: 'An open circular cloud storage ring pierced cleanly by a dynamic upward supersonic arrow. Blends vault safety with speed.',
  },
  {
    id: 'monogram',
    name: 'Concept 4: Monogram \'D\'',
    tagline: 'Lettermark with Negative Space',
    description: 'Geometric capital letter \'D\' housing a forward-pointing speed arrow carved directly into its negative space.',
  },
  {
    id: 'velocity',
    name: 'Concept 5: Velocity Flight',
    tagline: 'Modern Fletching Silhouette',
    description: 'Physical dart silhouette reimagined with sleek stabilizing flight fins and an arrow needle tip.',
  },
];
