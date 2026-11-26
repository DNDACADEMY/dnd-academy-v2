import { execFileSync, spawnSync } from 'node:child_process';

const git = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
if (git.status === 0) {
  execFileSync('lefthook', ['install'], { stdio: 'inherit' });
}
