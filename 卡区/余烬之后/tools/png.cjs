const assert = require('node:assert/strict');
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function readChunks(png) {
  assert(png.subarray(0, 8).equals(signature), '不是PNG文件');
  const chunks = [];
  let offset = 8;
  while (offset < png.length) {
    assert(offset + 12 <= png.length, 'PNG块头截断');
    const size = png.readUInt32BE(offset);
    const end = offset + 12 + size;
    assert(end <= png.length, 'PNG块数据截断');
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + size);
    assert.equal(crc32(png.subarray(offset + 4, end - 4)), png.readUInt32BE(end - 4), `PNG ${type} CRC错误`);
    chunks.push({ type, data, raw: png.subarray(offset, end) });
    offset = end;
    if (type === 'IEND') break;
  }
  assert.equal(offset, png.length, 'PNG包含未识别尾部数据');
  assert.equal(chunks[0]?.type, 'IHDR');
  assert.equal(chunks[0]?.data.length, 13);
  assert(
    chunks.some(c => c.type === 'IDAT'),
    'PNG缺少图像数据',
  );
  assert.equal(chunks.at(-1)?.type, 'IEND');
  return chunks;
}
function textChunk(key, value) {
  const data = Buffer.from(key + '\0' + Buffer.from(JSON.stringify(value), 'utf8').toString('base64'), 'ascii');
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  out.write('tEXt', 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, -4)), out.length - 4);
  return out;
}
function isCardChunk(chunk) {
  if (!['tEXt', 'zTXt', 'iTXt'].includes(chunk.type)) return false;
  const end = chunk.data.indexOf(0);
  return end >= 0 && ['chara', 'ccv3'].includes(chunk.data.toString('ascii', 0, end));
}
function embedCard(avatar, card) {
  const chunks = readChunks(avatar).filter(c => !isCardChunk(c));
  const v2 = { ...card, spec: 'chara_card_v2', spec_version: '2.0' };
  return Buffer.concat([
    signature,
    ...chunks.slice(0, -1).map(c => c.raw),
    textChunk('chara', v2),
    textChunk('ccv3', card),
    chunks.at(-1).raw,
  ]);
}
function extractCards(png) {
  const cards = {};
  for (const chunk of readChunks(png)) {
    if (chunk.type !== 'tEXt' || !isCardChunk(chunk)) continue;
    const end = chunk.data.indexOf(0);
    const key = chunk.data.toString('ascii', 0, end);
    assert(!Object.hasOwn(cards, key), `重复卡片块${key}`);
    cards[key] = JSON.parse(Buffer.from(chunk.data.subarray(end + 1).toString('ascii'), 'base64').toString('utf8'));
  }
  return cards;
}
module.exports = { readChunks, embedCard, extractCards, isCardChunk };
