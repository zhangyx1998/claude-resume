/* ---------------------------------------------------------
 * Copyright (c) 2026-present Yuxuan Zhang, web-dev@z-yx.cc
 * This source code is licensed under the MIT license.
 * You may find the full license in project root directory.
 * ------------------------------------------------------ */
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { chmodSync, readFileSync, rmSync } from "fs";
import { builtinModules } from "module";
import { resolve } from "path";
import { defineConfig, type Plugin } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import { fileURLToPath } from "url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..");
const $ = (...p: string[]) => resolve(ROOT, ...p);

function pick(input: Record<string, any>, ...keys: string[]) {
  return Object.fromEntries(
    keys.filter((k) => k in input).map((k) => [k, input[k]]),
  );
}

function read(file: string) {
  return readFileSync($(file), "utf-8");
}

const pkg = JSON.parse(read("package.json"));

// Keys carried over from the root package.json into the bare dist/package.json.
// dependencies are intentionally omitted: everything is bundled into index.js.
const distKeys = [
  "name",
  "version",
  "description",
  "engines",
  "license",
  "author",
  "repository",
  "homepage",
  "bugs",
  "keywords",
];

/**
 * Emit the publishable, dist-folder-as-root metadata: a bare package.json
 * (with the CLI `bin`), plus LICENSE and README. In debug builds only a stub
 * package.json is written so a stray `npm publish` from dist can't succeed.
 */
function packageMeta(isProduction: boolean): Plugin {
  const bin = { "claude-resume": "index.js" };
  const packageJSON = isProduction
    ? {
        ...pick(pkg, ...distKeys),
        type: "module",
        bin,
        publishConfig: { access: "public" },
      }
    : { private: true, type: "module", bin };
  return {
    name: "package-meta",
    buildStart() {
      this.emitFile({
        type: "asset",
        fileName: "package.json",
        source: JSON.stringify(packageJSON, null, 2),
      });
      if (!isProduction) return;
      this.emitFile({
        type: "asset",
        fileName: "LICENSE",
        source: read("LICENSE"),
      });
      this.emitFile({
        type: "asset",
        fileName: "README.md",
        source: read("README.md"),
      });
    },
  };
}

export default defineConfig((commandLineArgs) => {
  const dst = "dist";
  rmSync($(dst), { recursive: true, force: true });
  const isProduction = commandLineArgs.configDebug !== true;
  const sourcemap = isProduction ? false : "inline";

  const external = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
  ];

  const plugins = [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    esbuild({ target: "node18" }),
    packageMeta(isProduction),
  ];
  if (isProduction) plugins.push(terser());

  const outFile = $(dst, "index.js");

  // Rollup does not carry an executable bit; a `bin` entry must be runnable
  // directly (npm link / npx) without relying on npm's install-time chmod.
  plugins.push({
    name: "chmod-bin",
    writeBundle() {
      chmodSync(outFile, 0o755);
    },
  });

  return {
    input: $("src", "index.ts"),
    output: {
      format: "esm",
      file: outFile,
      banner: "#!/usr/bin/env node",
      sourcemap,
    },
    external,
    plugins,
  };
});
