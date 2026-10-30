import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Dart Official Brand Logo: Velocity Flight
 * Sleek aerodynamic competition dart with angled stabilizing fletchings and sharp tip.
 */
export const DartLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <defs>
      <linearGradient id="dart-velocity-grad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Arrow Tip */}
    <path d="M16 2L22 12H10L16 2Z" fill="url(#dart-velocity-grad)" />
    {/* Shaft */}
    <rect x="14.5" y="11" width="3" height="13" rx="0.5" fill="#10b981" />
    {/* Left Fletching Wing */}
    <path d="M14.5 17L8 23V28L14.5 24V17Z" fill="#059669" />
    {/* Right Fletching Wing */}
    <path d="M17.5 17L24 23V28L17.5 24V17Z" fill="#34d399" />
  </svg>
);
