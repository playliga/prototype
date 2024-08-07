/**
 * Tailwind configuration and customization file.
 *
 * @module
 */
import type { Config } from 'tailwindcss';
import { ThemeSetting } from './src/shared/constants';

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
    darkTheme: ThemeSetting.DARK,
    themes: [ThemeSetting.LIGHT, ThemeSetting.DARK],
  },
} satisfies Config;
