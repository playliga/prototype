import path from 'path';


exports.compilerConfig = {
  colors: true,
  hash: false,
  version: false,
  timings: true,
  assets: false,
  chunks: false,
  modules: false,
  reasons: false,
  children: false,
  source: false,
  errors: true,
  errorDetails: true,
  warnings: true
};

exports.loaders = {
  js: {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader'
  },
  eslint: {
    test: /\.jsx?$/,
    enforce: 'pre',
    exclude: /node_modules/,
    loader: 'eslint-loader',
    options: {
      emitWarning: true
    },
  },
  css: {
    test: /\.css$/,
    use: [
      'style-loader',
      'css-loader'
    ]
  },
  scss: {
    test: /\.scss$/,
    use: [
      'style-loader',
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          postcss: {}
        }
      },
      'sass-loader'
    ]
  },
  images: {
    test: /\.(png|jpg)$/,
    use: [{
      loader: 'url-loader'
    }]
  },
  fonts: {
    test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
    use: [{
      loader: 'url-loader',
      options: {
        limit: 100000
      }
    }]
  }
};
