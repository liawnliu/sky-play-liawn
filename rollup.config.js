import typescript from "@rollup/plugin-typescript";
// import dts from "rollup-plugin-dts";
import inlineCode from "rollup-plugin-inline-code";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import sucrase from '@rollup/plugin-sucrase';

export default [
  {
    input: "./src/main.ts",
    output: {
      file: "./bin/main.js",
      format: "cjs",
      name: "main",
      sourcemap: true,
    },
    plugins: [
      commonjs(),
      inlineCode(),
      typescript(),
      // 解决“Unexpected token (Note that you need plugins to import files that are not JavaScript)”
      sucrase({
        exclude: ['node_modules/**'],
        transforms: ['typescript', 'jsx'],
      }),
      copy({
        targets: [
          { src: 'assets/*', dest: 'bin/public' }
        ]
      })
    ],
  },
];
