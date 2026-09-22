// 仅提供本卡已打包的界面载荷，供真实酒馆页面临时预览；不读写酒馆存档。
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const version = require('../package.json').version;
const file = path.resolve(__dirname, `../release/${version}/余烬之后-${version}.json`);
http.createServer((req, res) => {
  if (req.url !== '/loaders') { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'http://127.0.0.1:8000' });
  const card = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.end(JSON.stringify(card.data.extensions.regex_scripts.slice(0, 3).map(r => r.replaceString)));
}).listen(8138, '127.0.0.1', () => console.log('Temporary card loaders: http://127.0.0.1:8138/loaders'));
