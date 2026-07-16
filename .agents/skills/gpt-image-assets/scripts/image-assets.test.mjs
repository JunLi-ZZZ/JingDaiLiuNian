import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(new URL("./image-assets.mjs", import.meta.url));
const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/69L2WQAAAABJRU5ErkJggg==";

test("generate sends the expected request and saves decoded image bytes", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "image-assets-test-"));
  let requestBody;
  let authorization;

  const server = http.createServer((request, response) => {
    authorization = request.headers.authorization;
    assert.equal(request.method, "POST");
    assert.equal(request.url, "/v1/images/generations");
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      requestBody = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ data: [{ b64_json: pngBase64 }] }));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [scriptPath, "generate", "--prompt", "test prompt", "--output", "asset.png"],
      {
        cwd: tempDirectory,
        env: {
          ...process.env,
          ZYUOU_API_KEY: "test-key",
          ZYUOU_OPENAI_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
        },
      },
    );

    assert.equal(authorization, "Bearer test-key");
    assert.deepEqual(requestBody, {
      model: "gpt-image-2",
      prompt: "test prompt",
      size: "1024x1024",
      quality: "low",
      output_format: "png",
      response_format: "b64_json",
      background: "auto",
      n: 1,
    });
    assert.deepEqual(await readFile(path.join(tempDirectory, "asset.png")), Buffer.from(pngBase64, "base64"));
    assert.deepEqual(JSON.parse(stdout), {
      saved: [{ path: "asset.png", bytes: 70, width: 1, height: 1 }],
      format: "png",
      count: 1,
    });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
