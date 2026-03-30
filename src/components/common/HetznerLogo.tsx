import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/**
 * Hetzner brand mark — "H" with right-pointing chevron (>) crossbar.
 * ViewBox 0 0 100 100.
 *
 * Structure:
 *  - Left vertical bar  (x 0–28)
 *  - Right vertical bar (x 72–100)
 *  - Upper diagonal strip in gap: (28,0)→(72,0)→(72,50)→(28,30)
 *  - Lower diagonal strip in gap: (28,100)→(72,100)→(72,50)→(28,70)
 */
export default function HetznerLogo({ size = 64, color = '#E2001A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Left bar */}
      <Path d="M0 0 H28 V100 H0 Z" fill={color} />
      {/* Right bar */}
      <Path d="M72 0 H100 V100 H72 Z" fill={color} />
      {/* Upper chevron arm */}
      <Path d="M28 0 L72 0 L72 50 L28 30 Z" fill={color} />
      {/* Lower chevron arm */}
      <Path d="M28 100 L72 100 L72 50 L28 70 Z" fill={color} />
    </Svg>
  );
}
