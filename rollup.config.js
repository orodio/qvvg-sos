import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";

export default [
  // Browser Build
  {
    input: "src/main.js",
    output: {
      name: "sos",
      file: pkg.browser,
      format: "umd"
    },
    plugins: [resolve(), commonjs()]
  },
  // CommonJS build
  {
    input: "src/main.js",
    external: [],
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" }
    ]
  }
];
