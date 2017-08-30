const rollup = require('rollup')
const buble = require('rollup-plugin-buble')
const eslint = require('rollup-plugin-eslint')
const uglify = require('rollup-plugin-uglify')

const MODULE_NAME = 'photoswippy'

const plugins = [eslint(), buble()]

const input = (path, plugins) => ({ input: path, plugins })
const output = (format, name) => ({
  format,
  name: MODULE_NAME,
  file: `dist/${name}.js`
})

rollup
  .rollup(input('src/index.js', plugins))
  .then(bundle => bundle.write(output('umd', 'photoswippy')))

rollup
  .rollup(input('src/index.js', [...plugins, uglify()]))
  .then(bundle => bundle.write(output('umd', 'photoswippy.min')))

if (process.argv.includes('watch') || process.argv.includes('--watch')) {
  console.info('[Watch] Watching files')
  rollup
    .watch([
      {
        ...input('src/index.js', plugins),
        output: output('umd', 'photoswippy')
      },
      {
        ...input('src/index.js', [...plugins, uglify()]),
        output: output('umd', 'photoswippy.min')
      }
    ])
    .on('event', event => {
      if (event.code === 'END') {
        console.info('[Watch] Finished to bundle code.')
      } else if (event.code === 'START') {
        console.info('[Watch] Starting to bundle code.')
      }
    })
}
