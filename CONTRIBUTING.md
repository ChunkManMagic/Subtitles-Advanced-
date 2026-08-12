# Contributing to Subtitles Advanced

Thanks for your interest in contributing! This project is maintained by **ChunkManMagic**.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies with `npm install` (or `bun install`).
3. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
4. (Optional) Copy `firebase-applet-config.example.json` to `firebase-applet-config.json`
   to enable subtitle caching with Firestore.

## Development

- `npm run dev` — start the dev server
- `npm run lint` — run ESLint
- `npm run typecheck` — run the TypeScript compiler
- `npm run build` — build the web app and server bundle

## Submitting Changes

- Create a feature branch off `main` (e.g. `fix/...` or `feature/...`).
- Keep changes focused and add a clear commit message.
- Open a pull request using the PR template.

## Code Style

- The project uses ESLint with the shared flat config in `eslint.config.js`.
- Do not commit secrets. Firebase config lives in `firebase-applet-config.example.json`;
  the real `firebase-applet-config.json` is gitignored.

## Code of Conduct

Be respectful and constructive. Harassment and discrimination are not tolerated.
