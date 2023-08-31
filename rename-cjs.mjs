/* eslint-env es6 */
//@ts-check
import * as fs from "node:fs/promises";
import { URL } from "node:url";
import * as console from "node:console";

/**
 * @param {URL} file
 * @returns {AsyncGenerator<URL>}
 */
export const listFiles = async function* (file) {
  const stats = await fs.stat(file);
  if (stats.isFile()) {
    yield file;
    return;
  }
  if (stats.isDirectory()) {
    file.pathname = file.pathname.replace(/\/*$/, "/");
    for (const name of await fs.readdir(file)) {
      yield* listFiles(new URL(name, file));
    }
  }
};

/** @type {Array<[URL, URL]>} */
const renames = [];
const cjsDir = new URL("cjs/", import.meta.url);
for await (const file of listFiles(cjsDir)) {
  if (/\.m[jt]s$/.test(file.pathname)) {
    const renamed = new URL(file.href);
    renamed.pathname = renamed.pathname.replace(/\.m([jt])s$/, ".c$1s");
    renames.push([file, renamed]);
  }
}
await Promise.all(
  renames.map(async ([from, to]) => {
    let code = await fs.readFile(from, "utf8");
    code = code.replace(/\.m([jt])s(['"])/g, ".c$1s$2");
    await fs.writeFile(to, code);
    await fs.unlink(from);
    console.info("renamed", to.pathname.slice(cjsDir.pathname.length));
  }),
);
