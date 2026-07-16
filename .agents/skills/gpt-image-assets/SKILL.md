---
name: gpt-image-assets
description: Generates and edits project image assets through the configured Zyuou GPT Image proxy, saves results inside the current workspace, and verifies the rendered files. Use when the user asks to generate images, edit images, create visual assets, produce character or background art, invokes GPT Image 2, or mentions 生图、改图、图生图、素材.
---

# GPT Image Assets

Use the repository script instead of writing one-off API calls. Read
[REFERENCE.md](REFERENCE.md) only when endpoint details or supported parameters
are needed.

## Prerequisites

- Run from the repository root.
- Read the API key only from `ZYUOU_API_KEY` or the ignored
  `.env.image.local` file.
- Never print, copy, commit, or ask the user to paste the key into chat.
- Default base URL: `https://api.zyuou.com/v1`.
- Default model: `gpt-image-2`.

If `.env.image.local` is absent, tell the user to create it from
`.env.image.example` and stop before making a paid request.

## Generate

Use a destination that belongs to the feature being built:

```bash
node .agents/skills/gpt-image-assets/scripts/image-assets.mjs generate --prompt "<detailed prompt>" --output "src/<feature>/assets/<name>.png"
```

Defaults are `1024x1024`, `quality=low`, `format=png`, `background=auto`, and
one image. Add `--quality medium|high`, `--size <width>x<height>`, or
`--background opaque` only when the task calls for it.

Map quality requests mechanically:

- Draft, preview, smoke test, or cheap iteration: keep `--quality low`.
- Final, production, polished, detailed, or high-quality asset: pass
  `--quality high`.
- Balanced quality or an explicit medium request: pass `--quality medium`.
- Quality and pixel dimensions are independent. Change `--size` only when the
  user or target layout requires a different resolution or aspect ratio.
- Treat `--size` as a request, not proof of final pixel dimensions. Read the
  script's reported PNG dimensions and resize or crop when the UI requires an
  exact pixel size.

## Edit

```bash
node .agents/skills/gpt-image-assets/scripts/image-assets.mjs edit --input "<source.png>" --prompt "<edit instructions>" --output "<destination.png>"
```

Add `--mask "<mask.png>"` for a masked edit. Use `--input-url "https://..."`
instead of `--input` only for a public source image.

## Model Check

The proxy guide specifies `gpt-image-2`. Check the provider catalog only when
the endpoint rejects that model or the user explicitly asks:

```bash
node .agents/skills/gpt-image-assets/scripts/image-assets.mjs models
```

## Completion

1. Allow up to three minutes for the synchronous request.
2. On success, inspect every saved image with the local image viewer.
3. Confirm the image is nonblank, correctly framed, and suitable for its UI use;
   compare reported dimensions with the target layout.
4. Iterate when the result misses the requested subject, composition, or legibility.
5. Report the saved workspace-relative path and the actual generation settings.

Do not overwrite an existing asset unless the user requested replacement; the
script requires `--force` for that case.
