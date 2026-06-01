# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.


---

# Academic Project Standards

## General Principles

- Keep the repository focused and free of irrelevant files
- Never commit secrets, credentials, or API keys
- Clearly document third-party code, templates, and AI-generated artifacts
- Prefer solutions that are understandable and explainable in an academic review

## Educational Priority

- Prefer clarity over cleverness
- Optimize for maintainability and explainability
- Avoid unnecessary abstractions and premature optimization
- Code should be defendable in an oral exam

## Repository & Collaboration

- Use meaningful commit messages, preferably Conventional Commits
- Keep commits small, focused, and logically grouped
- Suggest Issues, ADRs, and Pull Requests for major work streams
- Preserve a clean and understandable Git history

## README & Documentation

- Keep the README concise, actionable, and up to date
- README must explain:
  - project purpose
  - academic context
  - setup and installation
  - environment variables
  - local development workflow
  - deployment information if applicable
- Update documentation when behavior or architecture changes

## Reproducibility

- Ensure the project can be set up by a technically skilled third party
- Document required environment variables in `.env.example`
- Prefer deterministic and reproducible setups
- Keep dependency versions locked where possible
- Suggest seed scripts or example data when needed

## Code Quality

- Prefer simple, modular, and maintainable code
- Avoid magic numbers, strings, and hardcoded URLs
- Use meaningful names for files, functions, variables, and components
- Keep functions and components focused and reasonably small
- Avoid deep nesting and unnecessary indirection
- Remove dead, redundant, or placeholder code

## Robustness

- Validate important inputs explicitly
- Handle errors intentionally and visibly
- Add logging where useful for debugging or traceability
- Prioritize reliability in critical paths

## Architecture

- Respect separation of concerns
- Keep data access, business logic, and UI clearly separated
- Apply DRY and KISS pragmatically
- Introduce abstractions only after repeated use cases emerge
- Explain tradeoffs before major architectural decisions

## Consistency

- Follow consistent formatting and linting rules
- Prefer established project conventions over personal preference
- Avoid introducing multiple competing patterns

## Testing & Verification

- Add tests for critical or complex behavior
- Prefer meaningful tests over artificial coverage
- Ensure linting, type checks, and builds pass before major changes
- Suggest CI checks when appropriate

## Accessibility & Security

- Prefer accessible and responsive UI patterns
- Avoid common OWASP-style security mistakes
- Treat user data and privacy carefully
- Avoid unsafe defaults

## Agent Behavior

- Ask before introducing major dependencies or frameworks
- Prefer editing existing files over creating new abstractions
- Do not refactor unrelated code
- Explain important tradeoffs and architectural consequences
- Suggest simpler alternatives when complexity increases