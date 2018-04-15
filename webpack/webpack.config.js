/* eslint-disable global-require */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const postcssFlexbugs = require('postcss-flexbugs-fixes');
const configUtils = require('./configUtils');

const DEFAULTS = {
  baseDir: path.resolve(__dirname, '..'),
};

function makeConfig(options = {}) {
  _.defaults(options, DEFAULTS);

  return {
    mode: 'production',
    entry: {
      main: [path.join(options.baseDir, 'src/client/index.js')],
    },
    output: {
      path: path.join(options.baseDir, '/public/js'),
      filename: 'busyapp-[name].[chunkhash].js',
      publicPath: '/js/',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
          STEEMCONNECT_CLIENT_ID: JSON.stringify(process.env.STEEMCONNECT_CLIENT_ID || 'busy.app'),
          STEEMCONNECT_REDIRECT_URL: JSON.stringify(
            process.env.STEEMCONNECT_REDIRECT_URL || 'http://localhost:3000/callback',
          ),
          STEEMCONNECT_HOST: JSON.stringify(
            process.env.STEEMCONNECT_HOST || 'https://steemconnect.com',
          ),
          STEEMJS_URL: JSON.stringify(process.env.STEEMJS_URL || 'https://api.steemit.com'),
          IS_BROWSER: JSON.stringify(true),
          SIGNUP_URL: JSON.stringify(
            process.env.SIGNUP_URL || 'https://signup.steemit.com/?ref=busy',
          ),
        },
      }),
      new CleanWebpackPlugin([path.join(options.baseDir, '/public')], { allowExternal: true }),
      new CopyWebpackPlugin([
        {
          from: path.join(options.baseDir, '/assets'),
          to: path.join(options.baseDir, '/public'),
        },
      ]),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.optimize.AggressiveMergingPlugin(),
      new ExtractTextPlugin({
        allChunks: true,
        filename: '../css/style.[md5:contenthash:hex:20].css',
      }),
      new HtmlWebpackPlugin({
        title: 'Busy',
        filename: '../index.html',
        template: path.join(options.baseDir, '/templates/production_index.html'),
      }),
      new LodashModuleReplacementPlugin({
        collections: true,
        paths: true,
        shorthands: true,
        flattening: true,
      }),
      new BundleAnalyzerPlugin(),
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
          },
        },
      },
    },
    module: {
      rules: [
        {
          test: configUtils.MATCH_JS_JSX,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        {
          test: /\.(eot|ttf|woff|woff2|svg)(\?.+)?$/,
          loader: 'url-loader',
          options: {
            name: '../fonts/[name].[ext]',
            limit: 1,
          },
        },
        {
          test: /\.png$/,
          loader: 'file-loader',
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            removeComments: false,
          },
        },
        {
          test: configUtils.MATCH_CSS_LESS,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
                  plugins: () => [
                    require('autoprefixer')({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9', // React doesn't support IE8 anyway
                      ],
                    }),
                  ],
                },
              },
              {
                loader: 'less-loader',
                options: {
                  javascriptEnabled: true,
                },
              },
            ],
          }),
        },
      ],
    },
  };
}

module.exports = makeConfig();
