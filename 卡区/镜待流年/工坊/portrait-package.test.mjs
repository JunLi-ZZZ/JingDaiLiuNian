import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePortraitGroup, portraitUrl } from '../../../src/镜待流年/界面/shared/portrait-workshop.ts';

const group = () => ({ format: 'jdnl-portrait-group', version: 1, group: { id: 'cloud-1', name: '图库', items: [
  { id: '角色-动作', name: '角色', tag: '动作', url: 'https://example.com/image.png', caption: '说明' },
] } });
test('preserves Unicode IDs and drops arbitrary imported properties', () => {
  const data = group(); data.group.items[0].unexpected = 'discard';
  const parsed = parsePortraitGroup(data);
  assert.equal(parsed.items[0].id, '角色-动作');
  assert.equal(parsed.items[0].open, false);
  assert.equal('unexpected' in parsed.items[0], false);
  assert.equal(parsePortraitGroup(data.group).name, '图库');
});
test('rejects versions, duplicates and incomplete entries without partially importing', () => {
  const data = group();
  assert.throws(() => parsePortraitGroup({ ...data, version: 2 }));
  data.group.items.push({ ...data.group.items[0] });
  assert.throws(() => parsePortraitGroup(data));
  assert.throws(() => parsePortraitGroup({ name: 'bad', items: [{ id: 'only-id' }] }));
});
test('accepts raster data URLs and HTTP links, rejects executable or credential-bearing URLs', () => {
  assert.equal(portraitUrl('data:image/png;base64,aGVsbG8='), 'data:image/png;base64,aGVsbG8=');
  assert.equal(portraitUrl('https://example.com/image.webp'), 'https://example.com/image.webp');
  for (const value of ['javascript:alert(1)', 'file:///local.png', 'https://user:password@example.com/image', 'data:text/html;base64,aGVsbG8=', 'data:image/svg+xml;base64,aGVsbG8=']) assert.throws(() => portraitUrl(value));
});
