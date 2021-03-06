const rpWeb = require('neutrino-preset-mozilla-rpweb');
const banner = require('neutrino-middleware-banner');
const nodeExternals = require('webpack-node-externals');
const merge = require('deepmerge');
const { join } = require('path');

const MODULES = join(__dirname, 'node_modules');

module.exports = (neutrino, options = {}) => {
  if (neutrino.options.output.endsWith('build')) {
    neutrino.options.output = 'lib';
  }

  const webOptions = {
    polyfills: {
      babel: process.env.NODE_ENV === 'development'
    },
    babel: {
      presets: [
        ['babel-preset-env', {
          targets: {
            browsers: [
              'last 1 Chrome versions',
              'last 1 Firefox versions',
              'last 1 Edge versions',
              'last 1 Safari versions',
              'last 1 iOS versions'
            ]
          }
        }]
      ]
    }
  };

  neutrino.config.resolve.modules.add(MODULES);
  neutrino.config.resolveLoader.modules.add(MODULES);

  try {
    const pkg = require(join(neutrino.options.root, 'package.json'));
    const hasSourceMap = (pkg.dependencies && 'source-map-support' in pkg.dependencies) ||
      (pkg.devDependencies && 'source-map-support' in pkg.devDependencies);

    hasSourceMap && neutrino.use(banner);
  } catch (ex) {}

  neutrino.use(rpWeb, {
    react: merge(webOptions, options.react || {}),
    eslint: options.eslint
  });

  neutrino.config
    .devtool('source-map')
    .performance
      .hints(true)
      .end()
    .output
      .filename('[name].js')
      .library('[name]')
      .libraryTarget('umd')
      .umdNamedDefine(true);

  neutrino.config.when(process.env.NODE_ENV !== 'test', config => {
    config
      .plugins
        .delete('html')
        .end()
      .externals([nodeExternals()])
  });

  neutrino.config.when(neutrino.config.plugins.has('runtime-chunk'),
    config => {
      config.plugins
        .delete('runtime-chunk')
        .delete('vendor-chunk')
        .delete('named-modules')
        .delete('named-chunks')
        .delete('name-all');
    });
};
