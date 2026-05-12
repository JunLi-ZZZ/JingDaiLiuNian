const http = require('http');
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, 'dist');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(dist, url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found: ' + filePath);
    } else {
      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': mime[ext] || 'text/plain',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
    }
  });
});

server.listen(8080, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:8080/');
  console.log('Dist: ' + dist);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err);
});
