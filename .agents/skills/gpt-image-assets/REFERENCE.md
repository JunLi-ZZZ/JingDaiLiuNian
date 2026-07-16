# Zyuou GPT Image Proxy Reference

The user-provided endpoint overrides the example hostname in the provider
guide.

## Connection

- Base URL: `https://api.zyuou.com/v1`
- Authentication: `Authorization: Bearer <key>`
- Credential source: `ZYUOU_API_KEY` or `.env.image.local`
- Model: `gpt-image-2`
- Timeout: at least 120 seconds; the bundled script uses 180 seconds
- API mode: synchronous

Do not use asynchronous `/api/images/generations/jobs` endpoints and do not
send `gpt-image-2` to a chat-completions endpoint.

## Text To Image

`POST /images/generations` with JSON:

```json
{
  "model": "gpt-image-2",
  "prompt": "Detailed image description",
  "size": "1024x1024",
  "quality": "low",
  "output_format": "png",
  "response_format": "b64_json",
  "background": "auto",
  "n": 1
}
```

## Image Edit

`POST /images/edits`. For local files, send multipart fields `model`, `prompt`,
`image`, optional `mask`, `size`, `quality`, `output_format`,
`response_format`, and `background`.

For a public source URL, send JSON with an `images` array:

```json
{
  "model": "gpt-image-2",
  "prompt": "Detailed edit instructions",
  "images": [{ "image_url": "https://example.com/input.png" }],
  "size": "1024x1024",
  "quality": "low",
  "response_format": "b64_json"
}
```

## Response

The normal response is:

```json
{
  "data": [{ "b64_json": "<base64 image bytes>" }]
}
```

The script also accepts `data[].url` for compatibility. Provider errors about
the generation group indicate that the API key is not assigned to a group that
supports image generation.

The proxy may preserve the requested aspect ratio without returning the exact
requested pixel dimensions. Always use the dimensions reported by the script
for PNG output and resize or crop when exact dimensions matter.
