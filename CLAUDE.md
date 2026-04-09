# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev            # start dev server at localhost:3000
npm run build          # production build
npm run lint           # run ESLint
npm run test           # Vitest in watch mode
npm run test:run       # Vitest single run
npm run test:coverage  # Vitest with v8 coverage
```

Unit tests cover only server actions (`src/actions/**`) and utilities (`src/lib/**`). Components are not tested. See [context/ai-interaction.md](context/ai-interaction.md) → **Testing**.

IMPORTANT: Do not add Claude to any commit messages

## Neon MCP

- Project ID: `nameless-union-54973290`
- **Always use the `development` branch** (ID: `br-twilight-sound-ab75qld1`) for all Neon MCP queries and operations
- **Never use the `production` branch** (`br-ancient-meadow-ab0qrmp9`) unless I explicitly say so
