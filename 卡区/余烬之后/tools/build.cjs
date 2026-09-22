const path = require('node:path');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const root = path.resolve(__dirname, '../../..');
const card = path.resolve(__dirname, '..');
// 定向构建新卡两个脚本，不执行镜待流年 postbuild 或全仓库同步。
const scripts = {
  mode: 'production',
  context: root,
  entry: {
    '脚本/变量结构/index': path.join(card, '脚本/变量结构/index.ts'),
    '脚本/MVU/index': path.join(card, '脚本/MVU/index.ts'),
    '核心/engine': path.join(card, 'src/engine.ts'),
  },
  output: {
    path: path.join(card, 'build', require('../package.json').version),
    filename: '[name].js',
    module: true,
    library: { type: 'module' },
  },
  experiments: { outputModule: true },
  resolve: { extensions: ['.ts', '.js'] },
  module: { rules: [{ test: /\.ts$/, loader: require.resolve('ts-loader'), options: { transpileOnly: true } }] },
  externalsType: 'module',
  externals: [
    ({ request }, callback) => {
      if (request === 'lodash') return callback(null, 'var _');
      return /^https?:/.test(request || '') ? callback(null, request) : callback();
    },
  ],
  plugins: [new webpack.ProvidePlugin({ z: ['zod', 'z'], _: 'lodash' })],
};
// 自包含的UI构建：本地打包依赖，预览无需从CDN取得z/lodash/Vue。
const panel = {
  mode: 'production',
  context: root,
  entry: {
    status: path.join(card, '界面/状态栏/index.ts'),
    opening: path.join(card, '界面/封面/index.ts'),
    preview: path.join(card, '界面/状态栏/preview.ts'),
    cover: path.join(card, '界面/状态栏/cover-preview.ts'),
    body: path.join(card, '界面/状态栏/body.ts'),
    workshop: path.join(card, '界面/状态栏/workshop-preview.ts'),
    cards: path.join(card, '界面/状态栏/cards-preview.ts'),
  },
  output: {
    path: path.join(card, 'build', require('../package.json').version),
    filename: '界面/[name].js',
    publicPath: '',
  },
  resolve: { extensions: ['.ts', '.js', '.vue'] },
  module: {
    rules: [
      { test: /\.png$/, resourceQuery: /url/, type: 'asset/inline' },
      { test: /\.vue$/, loader: require.resolve('vue-loader') },
      {
        test: /\.ts$/,
        loader: require.resolve('ts-loader'),
        options: { transpileOnly: true, appendTsSuffixTo: [/\.vue$/] },
      },
      { test: /\.css$/, use: [require.resolve('vue-style-loader'), require.resolve('css-loader')] },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new webpack.ProvidePlugin({ z: ['zod', 'z'], _: 'lodash' }),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    }),
    ...[
      ['status', '界面/状态栏/index.html'],
      ['opening', '界面/封面/index.html'],
      ['preview', '预览/index.html'],
      ['cover', '预览/开局.html'],
      ['body', '界面/正文/index.html'],
      ['cards', '预览/卡片.html'],
      ['workshop', '预览/工坊.html'],
    ].map(
      ([chunk, filename]) =>
        new HtmlWebpackPlugin({
          template: path.join(card, '界面/状态栏/index.html'),
          filename,
          chunks: [chunk],
          inject: 'body',
        }),
    ),
    new HtmlInlineScriptPlugin(),
  ],
};
const compiler = webpack([scripts, panel]);
compiler.run((error, stats) => {
  if (error) {
    console.error(error);
    process.exitCode = 1;
  } else {
    console.log(stats.toString({ all: false, errors: true, warnings: true, assets: true }));
    if (stats.hasErrors()) process.exitCode = 1;
  }
  compiler.close(error => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
});
