# AGENTS.md

This file provides operating guidance for coding agents working in this repository.

## Purpose and scope
- **Scope:** applies to the entire repository rooted at this folder.
- This is a small static web project (`index.html`, `style.css`, `game.js`) plus documentation.

## Core workflow
1. Read this file before making changes.
2. Keep changes minimal, targeted, and easy to review.
3. Validate behavior locally whenever code is modified.
4. Summarize changes clearly with file/line references.

## Project layout
- `index.html` — page structure and in-document content.
- `style.css` — visual styling and layout rules.
- `game.js` — interactive behavior and game logic.
- `TARIFF_PANIC_PACKAGE.md` — project documentation/package details.

## Coding standards

### General
- Prefer simple, readable code over clever patterns.
- Do not introduce new dependencies unless explicitly requested.
- Keep naming descriptive and consistent with existing code.
- Avoid broad refactors when fixing a specific issue.

### JavaScript (`game.js`)
- Use small functions with single responsibilities.
- Guard against invalid state and edge cases.
- Add concise comments only where intent is non-obvious.
- Avoid global side effects unless required by current architecture.

### HTML/CSS (`index.html`, `style.css`)
- Keep semantic HTML structure.
- Favor reusable classes over one-off inline styles.
- Preserve responsive behavior when adjusting layout/styling.
- Maintain accessibility basics (labels, alt text, contrast, focus states).

## Validation checklist
When relevant to the change, run these checks before finishing:
- Open the app in a browser and verify there are no console errors.
- Confirm primary user flow still works end-to-end.
- Verify layout at common viewport sizes (mobile + desktop).

If a browser tool is available and the change affects UI, capture a screenshot artifact.

## Documentation expectations
- Update docs when behavior, controls, or setup steps change.
- Keep README/package docs synchronized with code changes.
- In final summaries, include:
  - what changed,
  - why it changed,
  - how it was validated.

## Git and PR hygiene
- Make focused commits with imperative subject lines.
- Do not commit unrelated edits.
- PR descriptions should include:
  - summary of user-visible impact,
  - validation steps,
  - follow-up items (if any).

## Out of scope / caution
- Do not add build tooling, frameworks, or package managers unless requested.
- Do not rewrite architecture without explicit approval.
- Flag ambiguous requirements and choose the safest minimal implementation.
