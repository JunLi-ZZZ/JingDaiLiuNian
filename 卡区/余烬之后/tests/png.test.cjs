const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { readChunks, embedCard, extractCards, isCardChunk } = require('../tools/png.cjs');
const avatar = fs.readFileSync(path.resolve(__dirname, '../assets/头像.png'));
test('头像封包可往返解析v2/v3中文卡名，并原样保留图像数据', () => {
  const card = { spec: 'chara_card_v3', spec_version: '3.0', data: { name: '余烬之后', first_mes: '你好，旅人。' } };
  const packed = embedCard(avatar, card);
  assert.deepEqual(extractCards(packed).ccv3, card);
  assert.equal(extractCards(packed).chara.spec, 'chara_card_v2');
  assert.deepEqual(
    readChunks(packed)
      .filter(c => !isCardChunk(c))
      .map(c => c.raw),
    readChunks(avatar)
      .filter(c => !isCardChunk(c))
      .map(c => c.raw),
  );
  const repacked = embedCard(packed, { ...card, data: { name: '余烬之后更新' } });
  assert.equal(readChunks(repacked).filter(isCardChunk).length, 2);
  assert.equal(extractCards(repacked).ccv3.data.name, '余烬之后更新');
});
test('损坏或截断的头像拒绝打包', () => {
  assert.throws(() => readChunks(avatar.subarray(0, 40)));
  const damaged = Buffer.from(avatar);
  damaged[40] ^= 1;
  assert.throws(() => readChunks(damaged));
});
