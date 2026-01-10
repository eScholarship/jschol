export default {
  plugins: {
    autoprefixer: {
      flexbox: 'no-2009',
      grid: false
    },
    'postcss-assets': {
      loadPaths: ['app/fonts/', 'app/images/'],
      basePath: '.',
      relative: true
    }
  }
}

