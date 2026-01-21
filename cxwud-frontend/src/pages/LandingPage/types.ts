import type { CSSProperties } from 'react';

export type LandingSectionProps = {
  style?: CSSProperties;
  heroStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  scrollHint: string;
  wordStyle?: CSSProperties;
  isActive?: boolean;
};

export type LandingTheme = {
  key: string;
  accent: string;
  light: string;
  dark: string;
  word: string;
};
