class NodePolyfillPlugin {
  apply(compiler) {
    // Storybook's Next preset pulls the real plugin in for broad browser
    // polyfills. The app stories only need basic globals; the real plugin also
    // pulls vulnerable crypto-browserify dependencies into dev audit results.
    compiler.options.resolve = compiler.options.resolve || {};
    compiler.options.resolve.fallback = {
      ...compiler.options.resolve.fallback,
      buffer: require.resolve('buffer/'),
      fs: false,
      process: require.resolve('process/browser'),
      util: require.resolve('util/'),
    };

    if (compiler.webpack && compiler.webpack.ProvidePlugin) {
      new compiler.webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }).apply(compiler);
    }
  }
}

module.exports = NodePolyfillPlugin;
