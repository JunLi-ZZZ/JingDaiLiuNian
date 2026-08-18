import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const targetName = process.argv[2];
if (!/^镜待流年_v\d+$/.test(targetName ?? '')) {
  console.error('用法: node copy_dist.mjs 镜待流年_v206');
  process.exit(1);
}

const source = resolve('dist', '镜待流年');
const target = resolve('dist', targetName);

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const sourcePath = resolve(from, name);
    const targetPath = resolve(to, name);
    if (statSync(sourcePath).isDirectory()) {
      copyTree(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

copyTree(source, target);
