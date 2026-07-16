#!/usr/bin/env node

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_BASE_URL = "https://api.zyuou.com/v1";
const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_TIMEOUT_MS = 180_000;
const QUALITY_VALUES = new Set(["low", "medium", "high"]);
const FORMAT_VALUES = new Set(["png", "jpeg", "webp"]);
const BACKGROUND_VALUES = new Set(["auto", "opaque"]);

function fail(message) {
  throw new Error(message);
}

function printHelp() {
  console.log(`Usage:
  image-assets.mjs models
  image-assets.mjs generate --prompt <text> --output <path> [options]
  image-assets.mjs edit --input <path> --prompt <text> --output <path> [options]
  image-assets.mjs edit --input-url <url> --prompt <text> --output <path> [options]

Options:
  --model <name>          Default: gpt-image-2
  --size <WxH>            Default: 1024x1024
  --quality <level>       low, medium, or high. Default: low
  --format <format>       png, jpeg, or webp. Inferred from output by default
  --background <mode>     auto or opaque. Default: auto
  --n <count>             Number of generated images. Default: 1
  --mask <path>           Optional mask for a local image edit
  --force                 Allow overwriting existing output files
  --help                  Show this help

Credentials:
  Set ZYUOU_API_KEY in the environment or .env.image.local.
  ZYUOU_OPENAI_BASE_URL optionally overrides https://api.zyuou.com/v1.`);
}

function parseArgs(argv) {
  const [command, ...tokens] = argv;
  const options = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      fail(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    if (key === "force" || key === "help") {
      options[key] = true;
      continue;
    }

    const value = tokens[index + 1];
    if (!value || value.startsWith("--")) {
      fail(`Missing value for --${key}`);
    }
    options[key] = value;
    index += 1;
  }

  return { command, options };
}

function parseEnvFile(content) {
  const values = {};
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function loadConfig(cwd) {
  let local = {};
  try {
    local = parseEnvFile(await readFile(path.join(cwd, ".env.image.local"), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const apiKey = process.env.ZYUOU_API_KEY || local.ZYUOU_API_KEY;
  const baseUrl = (
    process.env.ZYUOU_OPENAI_BASE_URL ||
    local.ZYUOU_OPENAI_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/u, "");

  if (!apiKey || apiKey === "replace-with-your-key") {
    fail(
      "Missing ZYUOU_API_KEY. Create .env.image.local from .env.image.example and add the real key.",
    );
  }

  return { apiKey, baseUrl };
}

function normalizeOptions(options) {
  const output = options.output;
  const extension = output ? path.extname(output).toLowerCase() : "";
  const inferredFormat = extension === ".jpg" ? "jpeg" : extension.slice(1);
  const format = options.format || (FORMAT_VALUES.has(inferredFormat) ? inferredFormat : "png");
  const quality = options.quality || "low";
  const background = options.background || "auto";
  const size = options.size || "1024x1024";
  const n = Number.parseInt(options.n || "1", 10);

  if (!QUALITY_VALUES.has(quality)) fail(`Unsupported quality: ${quality}`);
  if (!FORMAT_VALUES.has(format)) fail(`Unsupported format: ${format}`);
  if (!BACKGROUND_VALUES.has(background)) fail(`Unsupported background: ${background}`);
  if (!/^\d{2,5}x\d{2,5}$/u.test(size)) fail(`Invalid size: ${size}`);
  if (!Number.isInteger(n) || n < 1 || n > 10) fail("--n must be between 1 and 10");

  return {
    model: options.model || DEFAULT_MODEL,
    size,
    quality,
    format,
    background,
    n,
  };
}

function resolveWorkspacePath(cwd, filePath, label) {
  const absolute = path.resolve(cwd, filePath);
  const relative = path.relative(cwd, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} must stay inside the current workspace: ${filePath}`);
  }
  return absolute;
}

async function ensureWritableOutput(outputPath, force) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  if (force) return;
  try {
    await access(outputPath, fsConstants.F_OK);
    fail(`Output already exists. Choose another path or pass --force: ${outputPath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function outputPathAtIndex(outputPath, index, count) {
  if (count === 1) return outputPath;
  const extension = path.extname(outputPath);
  return path.join(
    path.dirname(outputPath),
    `${path.basename(outputPath, extension)}-${index + 1}${extension}`,
  );
}

function imageMetadata(bytes) {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(pngSignature)) {
    return {
      bytes: bytes.length,
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }
  return { bytes: bytes.length };
}

async function apiRequest(url, init, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const body = (await response.text()).slice(0, 4_000);
      fail(`Image API request failed (${response.status} ${response.statusText}): ${body}`);
    }
    return response;
  } catch (error) {
    if (error?.name === "AbortError") {
      fail(`Image API request timed out after ${Math.round(timeoutMs / 1000)} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson(url, apiKey, init = {}) {
  const response = await apiRequest(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  return response.json();
}

async function saveResults(data, cwd, outputOption, format, force) {
  if (!Array.isArray(data?.data) || data.data.length === 0) {
    fail("Image API returned no images in data[]");
  }

  const requestedOutput = resolveWorkspacePath(cwd, outputOption, "Output path");
  const paths = data.data.map((_, index) =>
    outputPathAtIndex(requestedOutput, index, data.data.length),
  );
  for (const outputPath of paths) await ensureWritableOutput(outputPath, force);

  const saved = [];
  for (let index = 0; index < data.data.length; index += 1) {
    const item = data.data[index];
    let bytes;
    if (item.b64_json) {
      bytes = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      const response = await apiRequest(item.url, {});
      bytes = Buffer.from(await response.arrayBuffer());
    } else {
      fail(`Image result ${index + 1} has neither b64_json nor url`);
    }
    if (bytes.length === 0) fail(`Image result ${index + 1} is empty`);
    await writeFile(paths[index], bytes);
    saved.push({ path: path.relative(cwd, paths[index]), ...imageMetadata(bytes) });
  }

  console.log(
    JSON.stringify(
      {
        saved,
        format,
        count: paths.length,
      },
      null,
      2,
    ),
  );
}

async function listModels(config) {
  const data = await requestJson(`${config.baseUrl}/models`, config.apiKey, { method: "GET" });
  const models = Array.isArray(data?.data)
    ? data.data.map((item) => item?.id).filter(Boolean).sort()
    : [];
  const imageModels = models.filter((id) => /image|dall-e/iu.test(id));
  console.log(JSON.stringify({ imageModels, modelCount: models.length }, null, 2));
}

async function generate(config, cwd, options) {
  if (!options.prompt) fail("generate requires --prompt");
  if (!options.output) fail("generate requires --output");
  const normalized = normalizeOptions(options);
  const data = await requestJson(`${config.baseUrl}/images/generations`, config.apiKey, {
    method: "POST",
    body: JSON.stringify({
      model: normalized.model,
      prompt: options.prompt,
      size: normalized.size,
      quality: normalized.quality,
      output_format: normalized.format,
      response_format: "b64_json",
      background: normalized.background,
      n: normalized.n,
    }),
  });
  await saveResults(data, cwd, options.output, normalized.format, options.force);
}

function mediaType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return (
    {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    }[extension] || "application/octet-stream"
  );
}

async function appendFile(form, field, filePath) {
  const bytes = await readFile(filePath);
  form.append(field, new Blob([bytes], { type: mediaType(filePath) }), path.basename(filePath));
}

async function edit(config, cwd, options) {
  if (!options.prompt) fail("edit requires --prompt");
  if (!options.output) fail("edit requires --output");
  if (Boolean(options.input) === Boolean(options["input-url"])) {
    fail("edit requires exactly one of --input or --input-url");
  }
  if (options.mask && !options.input) fail("--mask requires a local --input file");

  const normalized = normalizeOptions(options);
  let body;

  if (options.input) {
    const input = resolveWorkspacePath(cwd, options.input, "Input path");
    const form = new FormData();
    form.append("model", normalized.model);
    form.append("prompt", options.prompt);
    form.append("size", normalized.size);
    form.append("quality", normalized.quality);
    form.append("output_format", normalized.format);
    form.append("response_format", "b64_json");
    form.append("background", normalized.background);
    await appendFile(form, "image", input);
    if (options.mask) {
      const mask = resolveWorkspacePath(cwd, options.mask, "Mask path");
      await appendFile(form, "mask", mask);
    }
    body = form;
  } else {
    body = JSON.stringify({
      model: normalized.model,
      prompt: options.prompt,
      images: [{ image_url: options["input-url"] }],
      size: normalized.size,
      quality: normalized.quality,
      output_format: normalized.format,
      response_format: "b64_json",
      background: normalized.background,
    });
  }

  const data = await requestJson(`${config.baseUrl}/images/edits`, config.apiKey, {
    method: "POST",
    body,
  });
  await saveResults(data, cwd, options.output, normalized.format, options.force);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === "--help" || options.help || command === "help") {
    printHelp();
    return;
  }
  if (!["models", "generate", "edit"].includes(command)) {
    fail(`Unknown command: ${command}`);
  }

  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  if (command === "models") await listModels(config);
  if (command === "generate") await generate(config, cwd, options);
  if (command === "edit") await edit(config, cwd, options);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
