# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Unit Test** - Add/update Vitest unit tests for any new or changed server actions (`src/actions/**`) or utilities (`src/lib/**`). See the **Testing** section below.
5. **Verify** - Verify it works in the browser. Run `npm run test:run` and `npm run build` and fix any errors.
6. **Iterate** - Iterate and change things if needed
7. **Commit** - Only after tests pass, build passes, and everything works
8. **Merge** - Merge to main
9. **Delete Branch** - Delete branch after merge
10. **Review** - Review AI-generated code periodically and on demand.
11. Mark as completed in @context/current-feature.md and add to history

Do NOT commit without permission and until tests and build pass. If either fails, fix the issues first.

## Testing

We use [Vitest](https://vitest.dev/) for unit testing. Scope is intentionally narrow:

- **In scope:** server actions (`src/actions/**`) and utilities/lib code (`src/lib/**`)
- **Out of scope:** React components, pages, layouts, client-side UI. Do not write component tests.

### Conventions

- Co-locate tests next to the file under test: `src/lib/foo.ts` → `src/lib/foo.test.ts`
- Use `describe` / `it` / `expect` globals (configured in `vitest.config.ts`)
- Environment is `node` — no DOM, no jsdom
- Mock external dependencies (Prisma, Resend, Upstash, OpenAI, `next/headers`, `next/navigation`) with `vi.mock`; never hit the real database or external services from a unit test
- For server actions, test the pure logic: input validation, error shapes, the `{ success, data, error }` return contract, and branching on auth/session state
- Keep tests fast and deterministic — no network, no timers unless faked

### Commands

```bash
npm run test           # watch mode
npm run test:run       # single run (CI / pre-commit)
npm run test:coverage  # single run with v8 coverage report
```

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)
