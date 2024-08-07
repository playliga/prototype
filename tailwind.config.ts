/**
 * Tailwind configuration and customization file.
 *
 * @module
 */
import type { Config } from 'tailwindcss';
import { ThemeSettings } from './src/shared/constants';

/** @exports */
export default {
  content: [
    './src/frontend/components/**/*.tsx',
    './src/frontend/routes/**/*.tsx',
    './src/frontend/windows/**/*.tsx',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            blockquote: {
              quotes: 'none',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    logs: false,
    darkTheme: ThemeSettings.DARK,
    themes: [ThemeSettings.LIGHT, ThemeSettings.DARK],
  },
} satisfies Config;
