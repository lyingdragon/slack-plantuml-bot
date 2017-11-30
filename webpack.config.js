var webpack = require("webpack");

module.exports = {
    // メインとなるJavaScriptファイル（エントリーポイント）
    entry: './src/main/main.ts',
    target: 'node',
    // ファイルの出力設定
    output: {
      //  出力ファイルのディレクトリ名
      path: `${__dirname}/build`,
      // 出力ファイル名
      filename: 'bundle.js',
      libraryTarget: "commonjs2"
    },
    module: {
      rules: [
        {
          // 拡張子 .ts の場合
          test: /\.ts$/,
          // TypeScript をコンパイルする
          use: 'awesome-typescript-loader'
        },
        // ソースマップファイルの処理
        {
          enforce: 'pre',
          test: /\.js$/,
          loader: 'source-map-loader'
        }
      ]
    },
    // import 文で .ts ファイルを解決するため
    resolve: {
      extensions: [
        '.ts', '.js', '.json'
      ]
    },
    // ソースマップを有効に
    devtool: 'source-map',
    // コレより下の設定は「ビルド時の警告&エラーを失くすため」だけの指定。
    node: {
        console: true,
        net: 'empty',
        tls: 'empty',
        fs: 'empty',
        readline: 'empty',
        vertx: 'empty',
        dns: 'empty'
    },
    plugins: [
      new webpack.IgnorePlugin(/vertx/),
      new webpack.IgnorePlugin(/bufferutil/),
      new webpack.IgnorePlugin(/utf-8-validate/)
    ]
};
