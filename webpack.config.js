const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    background: './background.ts',
    content: './content.ts',
    popup: './popup/popup.ts',
    options: './options/options.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  devtool: 'source-map',
};
