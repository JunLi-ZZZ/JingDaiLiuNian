// restore_published_dist.mjs
// push 后执行，确保已发布版本的 dist 文件夹都在
// 用法: node restore_published_dist.mjs

import { execSync } from 'node:child_process';

const PUBLISHED = ['v55', 'v75', 'v83'];

for (const v of PUBLISHED) {
  const folder = `dist/镜待流年_${v}`;
  try {
    const exists = execSync(`git ls-files "${folder}/界面/封面/index.html"`, { encoding: 'utf8' }).trim();
    if (exists) {
      console.log(`✓ ${folder} 存在`);
    } else {
      throw new Error('missing');
    }
  } catch {
    // 从 git 历史恢复
    const commits = execSync(`git log --all --diff-filter=A --oneline -- "${folder}/*"`, { encoding: 'utf8' });
    const match = commits.match(/^(\w+)/);
    if (match) {
      execSync(`git checkout ${match[1]} -- "${folder}/"`, { stdio: 'inherit' });
      console.log(`✓ ${folder} 已从 ${match[1]} 恢复`);
    } else {
      console.error(`✗ ${folder} 无法恢复，git 历史中未找到`);
    }
  }
}

console.log('完成。如有恢复的文件夹，请 git add + git commit + git push。');
