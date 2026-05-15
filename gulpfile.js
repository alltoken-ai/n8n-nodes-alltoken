const { src, dest } = require('gulp');

// Copies node/credential icons (svg/png) and codex metadata (*.node.json) into dist/.
// tsc only emits .js/.d.ts, so these static assets need to be copied alongside.
function buildIcons() {
  return src('nodes/**/*.{png,svg,json}', { base: '.' }).pipe(dest('dist'));
}

exports['build:icons'] = buildIcons;
