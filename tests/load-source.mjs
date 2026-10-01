import ts from 'typescript';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

// Compile real TS/TSX modules for Node's test runner, without a test dependency.
export function sourceLoader() {
  const parent = resolve('node_modules/.tmp');
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(resolve(parent, 'cone-tests-'));
  const modules = new Map();
  function compile(path) {
    path = resolve(path);
    if (modules.has(path)) return modules.get(path);
    const output = resolve(directory, `${modules.size}-${basename(path)}.mjs`);
    modules.set(path, output);
    if (path.endsWith('.css')) {
      writeFileSync(output, 'export default new Proxy({}, { get: (_, key) => key });');
      return output;
    }
    let code = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    code = code.replace(/from (["'])(\.[^"']+)\1/g, (_, quote, name) => {
      const base = resolve(dirname(path), name);
      const dependency = [base, base + '.ts', base + '.tsx'].find(existsSync);
      if (!dependency) throw new Error(`Missing module ${base}`);
      return `from ${quote}${pathToFileURL(compile(dependency)).href}${quote}`;
    });
    writeFileSync(output, code);
    return output;
  }
  return {
    load: path => import(pathToFileURL(compile(path)).href),
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}
