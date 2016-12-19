module.exports = {
  entry: './app/jsx/App.jsx',
  output: {
    filename: 'bundle.js',
    path: './app/js'
  },
  module: {
    loaders: [{
      test: /\.jsx$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    },
    {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  }
}