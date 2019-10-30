import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import size from 'rollup-plugin-size'
import sourcemaps from 'rollup-plugin-sourcemaps'
import pkg from './package.json'

export default [
  // Browser Build
  {
    input: 'src/main.js',
    output: {
      name: 'sos',
      file: pkg.browser,
      format: 'umd',
      sourceMap: true,
    },
    plugins: [resolve(), commonjs(), sourcemaps(), size()],
  },
  // CommonJS build
  {
    input: 'src/main.js',
    external: [],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourceMap: true,
      },
      {
        file: pkg.module,
        format: 'es',
        sourceMap: true,
      },
    ],
    plugins: [resolve(), commonjs(), sourcemaps(), size()],
  },
]
