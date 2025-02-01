/**
 * Webpack configuration for Electron's
 * main and renderer processes.
 *
 * @module
 */
import 'dotenv/config';
import path from 'path';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { EnvironmentPlugin } from 'webpack';
import type { Configuration, ModuleOptions } from 'webpack';

/**
 * Webpack shared configuration.
 *
 * @constant
 */
const WebpackSharedConfig: Partial<Configuration> = {
  plugins: [new ForkTsCheckerWebpackPlugin({ logger: 'webpack-infrastructure' })],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      '@liga': path.resolve(__dirname, 'src'),
      'package.json': path.resolve(__dirname, 'package.json'),
    },
  },
};

/**
 * Webpack module rules.
 *
 * @constant
 */
const WebpackRulesConfig: Required<ModuleOptions>['rules'] = [
  {
    test: /native_modules\/.+\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(m?js|node)$/,
    exclude: /\.prisma/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
];

/**
 * Webpack configuration options for
 * the main Electron process.
 *
 * @constant
 */
export const ElectronMainWebpackConfig: Configuration = {
  ...WebpackSharedConfig,
  entry: './src/backend/index.ts',
  module: { rules: WebpackRulesConfig },
  plugins: [
    new EnvironmentPlugin([
      'GH_ISSUES_CLIENT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_KEY_ID',
      'FIREBASE_PROJECT_ID',
    ]),
    new CopyPlugin({
      patterns: [{ from: './node_modules/.prisma/client' }],
    }),
  ],
};

/**
 * Webpack configuration options for
 * the renderer Electron process.
 *
 * @constant
 */
export const ElectronRendererWebpackConfig: Configuration = {
  ...WebpackSharedConfig,
  module: {
    rules: [
      ...WebpackRulesConfig,
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['tailwindcss/nesting', 'tailwindcss', 'autoprefixer'],
              },
            },
          },
        ],
      },
      {
        test: /(\.mp4|\.png|\.webm)$/,
        type: 'asset/inline',
      },
    ],
  },
};
