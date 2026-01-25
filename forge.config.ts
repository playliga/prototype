/**
 * Electron Forge main configuration object.
 *
 * @module
 */
import 'dotenv/config';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { ElectronMainWebpackConfig, ElectronRendererWebpackConfig } from './webpack.config';

/**
 * Electron Forge main configuration object.
 *
 * @constant
 */
const config: ForgeConfig = {
  buildIdentifier: 'alpha',
  packagerConfig: {
    asar: true,
    appBundleId: 'gg.playliga.application',
    appCopyright: 'Copyright © 2024 Steve Rivera',
    extraResource: [
      './src/backend/prisma/saves',
      './src/backend/prisma/migrations',
      './src/resources/blazonry',
      './src/resources/maps',
      './src/resources/markdown',
      './src/resources/trophies',
      './src/resources/certs',
      './src/resources/sponsors',
      './src/resources/competitions',
      './src/resources/avatars',
      './src/resources/audio',
    ],
    icon: './src/frontend/assets/icon',
  },
  makers: [
    new MakerSquirrel({
      setupIcon: './src/frontend/assets/icon.ico',
      iconUrl: 'https://raw.githubusercontent.com/playliga/website/main/public/favicon.ico',
    }),
    new MakerDMG({
      icon: './src/frontend/assets/icon.ico',
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        authToken: process.env.GH_PUBLISH_API_KEY,
        draft: false,
        prerelease: false,
        repository: {
          owner: 'playliga',
          name: 'application',
        },
      },
    },
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
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
            js: './src/frontend/windows/modal.tsx',
            name: 'modal_window',
            preload: {
              js: './src/frontend/lib/preload.ts',
            },
          },
        ],
      },
    }),
    // fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

/**
 * Exports this module.
 *
 * @exports
 */
export default config;
