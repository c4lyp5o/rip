#!/usr/bin/env node
/**
 * Find JSX components used but never imported/defined in the file.
 * Catches the "Check is not defined" class of bug (runtime ReferenceError
 * that a build happily passes).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.argv[2] || "src";
const files = [];
(function walk(dir) {
	for (const e of readdirSync(dir)) {
		const p = join(dir, e);
		if (statSync(p).isDirectory()) walk(p);
		else if ([".jsx", ".js"].includes(extname(p))) files.push(p);
	}
})(ROOT);

const BUILTINS = new Set([
	"Fragment", "React", "Suspense", "Profiler", "StrictMode",
]);

let found = 0;
for (const file of files) {
	const src = readFileSync(file, "utf8");
	// names imported
	const imported = new Set();
	for (const m of src.matchAll(/import\s+(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from/g)) {
		if (m[1]) imported.add(m[1]);
		if (m[2]) {
			for (const part of m[2].split(",")) {
				const name = part.split(" as ").pop().trim();
				if (name) imported.add(name);
			}
		}
	}
	// locally declared
	const declared = new Set();
	for (const m of src.matchAll(/(?:const|let|var|function|class)\s+([A-Z][\w$]*)/g)) declared.add(m[1]);
	for (const m of src.matchAll(/([A-Z][\w$]*)\s*=/g)) declared.add(m[1]);

	// JSX component usage
	const used = new Set();
	for (const m of src.matchAll(/<([A-Z][\w$]*)[\s/>]/g)) used.add(m[1]);

	const missing = [...used].filter(
		(n) => !imported.has(n) && !declared.has(n) && !BUILTINS.has(n),
	);
	if (missing.length) {
		found += missing.length;
		console.log(`${file}: ${missing.join(", ")}`);
	}
}
console.log(found === 0 ? "no undefined JSX components found" : `\n${found} suspect reference(s)`);
