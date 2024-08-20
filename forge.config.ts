/**
 * Electron Forge main configuration object.
 *
 * @module
 */
import 'dotenv/config';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { ElectronMainWebpackConfig, ElectronRendererWebpackConfig } from './webpack.config';
import type { ForgeConfig } from '@electron-forge/shared-types';

/**
 * Electron Forge main configuration object.
 *
 * @constant
 */
const config: ForgeConfig = {
  buildIdentifier: 'alpha',
  packagerConfig: {
    appBundleId: 'io.steverivera.liga',
    appCopyright: 'Copyright © 2024 Steve Rivera',
    extraResource: ['./src/backend/prisma/databases', './src/resources'],
    icon: './src/frontend/assets/icon',
  },
  makers: [
    new MakerSquirrel({
      setupIcon: './src/frontend/assets/icon.ico',
      iconUrl: 'https://raw.githubusercontent.com/lemonpole/liga-public/main/public/favicon.ico',
    }),
    new MakerDMG({
      icon: './src/frontend/assets/icon.ico',
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        authToken: process.env.GITHUB_PUBLISH_API_KEY,
        prerelease: true,
        repository: {
          owner: 'lemonpole',
          name: 'LIGA',
        },
      },
    },
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig: ElectronMainWebpackConfig,
      renderer: {
        config: ElectronRendererWebpackConfig,
        entryPoints: [
          {
            html: './src/frontend/assets/index.html',
            js: './src/frontend/windows/main.tsx',
            name: 'main_window',
            preload: {
              js: './src/frontend/lib/preload.ts',
            },
          },
          {
            html: './src/frontend/assets/index.html',
            js: './src/frontend/windows/splash.tsx',
            name: 'splash_window',
            preload: {
              js: './src/frontend/lib/preload.ts',
            },
          },
          {
            html: './src/frontend/assets/index.html',
            js: './src/frontend/windows/landing.tsx',
            name: 'landing_window',
            preload: {
              js: './src/frontend/lib/preload.ts',
            },
          },
          {
            html: './src/frontend/assets/index.html',
            js: './src/frontend/windows/threading.tsx',
            name: 'threading_window',
            nodeIntegration: true,
          },
          {
            html: './src/frontend/assets/index.html',
            js: './src/frontend/windows/modal.tsx',
            name: 'modal_window',
            preload: {
              js: './src/frontend/lib/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

/**
 * Exports this module.
 *
 * @exports
 */
export default config;
