import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/watch.js',
    output: {
      file: 'dist/watch-bundle.js',
      format: 'esm',
      plugins: [terser()],
    },
    plugins: [resolve()],
    external: ['dotenv', 'twilio', '@1password/connect'] // <-- suppresses the warning for external dependencies
  },
  {
    input: 'scripts/encrypt.js',
    output: {
      file: 'dist/scripts/encrypt.bundle.js',
      format: 'esm',
      plugins: [terser()]
    },
    plugins: [resolve()],
  },
  {
    input: 'scripts/decrypt.js',
    output: {
      file: 'dist/scripts/decrypt.bundle.js',
      format: 'esm',
      plugins: [terser()]
    },
    plugins: [resolve()],
  },
];