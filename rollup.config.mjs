import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import fs from "node:fs";

export default {
  input: JSON.parse(fs.readFileSync("package.json", "utf-8")).main,
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
  ],
  onwarn: (e) => {
    if (e.code === "MISSING_NODE_BUILTINS") return;

    throw new Error(e);
  },
  output: [
    {
      format: "iife",
      name: "HyperdeckJSLib",
      file: "bundled.js",
      globals: (a) => `require(${JSON.stringify(a)})`,
    },
  ],
};
