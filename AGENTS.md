# Repository Contribution Guidelines

## Commit Messages
- Use the **Conventional Commits** style for all commit messages.
  - Example: `feat(ui): add overlay positioning tests`.

## Branch Naming
- Use a consistent branch naming pattern when creating branches.
  - A recommended format is `feature/<short-description>` or `bugfix/<short-description>`.

## Testing Requirements
- **Always write tests** for any new code you introduce.
- Before committing, run the following commands:
  - `npm run lint`
  - `npm run type-check`
  - `npm test`

## Project Structure
- Follow the directory and file organization described in `README.md`.
- If you make major changes to the structure or overall design, update `README.md` accordingly.

## Documentation
- Consult files under `docs/` (plans and requirements) for design decisions and project context.
