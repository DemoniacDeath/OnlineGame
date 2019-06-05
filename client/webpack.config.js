const path = require('path');
const webpack = require('webpack');

function apiHost() {
  switch (process.env.NODE_ENV) {
    case 'prod': return "https://server.onlinegame.demo.demoniacdeath.me";
    case 'dev':
    default: return "http://localhost:8081/";
  }
}

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.DefinePlugin({
      API_URL: "'"+apiHost()+"'"
    })
  ]
};