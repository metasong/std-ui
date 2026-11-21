// Builds the demo for GitHub Pages and force-pushes `demo/dist` to the `gh-pages` branch.
//   npm run demo:publish            (base defaults to `/<repo>/`, derived from the origin remote)
//   DEMO_BASE=/ npm run demo:publish   (override, e.g. for a user/org site or custom domain)
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const run = (cmd, cwd = root, env = {}) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
const out = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();

const remote = out('git remote get-url origin');
const repo = /\/([^/]+?)(?:\.git)?$/.exec(remote)?.[1];
const base = process.env.DEMO_BASE ?? `/${repo}/`;

run('npm run demo:build', root, { DEMO_BASE: base });

const tmp = mkdtempSync(join(tmpdir(), 'demo-pages-'));
try {
	cpSync(join(root, 'demo', 'dist'), tmp, { recursive: true });
	writeFileSync(join(tmp, '.nojekyll'), '');
	run('git init -q -b gh-pages', tmp);
	run('git add -A', tmp);
	run('git commit -q -m "Deploy demo"', tmp);
	run(`git push -f "${remote}" gh-pages`, tmp);
} finally {
	rmSync(tmp, { recursive: true, force: true });
}

const [, owner] = /github\.com[:/]([^/]+)\//.exec(remote) ?? [];
console.log(`\nPublished. https://${owner}.github.io${base}`);
