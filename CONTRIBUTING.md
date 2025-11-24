# Contributing to A-Station

Thank you for contributing to A-Station! This guide will help you maintain consistency with our development practices.

## Commit Message Guidelines

We follow a structured commit message format to maintain a clear and consistent git history.

### Format Rules

#### Small Changes (Single Line)
For minor changes like typo fixes, small tweaks, or single-file updates:

```
Brief description of what changed
```

**Examples:**
```
Fix typo in login validation message
Update button hover color
Remove unused import from Canvas component
```

#### Large Changes (Multi-Line with Type)
For substantial changes involving multiple files or significant logic:

```
Brief summary header

- First change made
- Second change made
- Third change made
- Additional changes...

Type: <type>
```

**Examples:**
```
Refactor authentication system

- Migrate from JWT to session-based auth
- Update user model with session fields
- Add middleware for session management
- Update tests for new auth flow

Type: refactor
```

```
Add workspace sharing feature

- Create sharing API endpoints
- Add share modal UI component
- Implement permission checks
- Add sharing tests

Type: feat
```

### Commit Types

Use these standardized types at the bottom of large commits:

| Type | Description |
|------|-------------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code refactoring (no functionality change) |
| `change` | Behavior or functionality change |
| `docs` | Documentation only changes |
| `style` | Code formatting, whitespace, etc. |
| `test` | Adding or updating tests |
| `chore` | Maintenance, dependencies, tooling |
| `perf` | Performance improvements |

### Best Practices

1. **Use imperative mood**: "Add feature" not "Added feature" or "Adding feature"
2. **Keep the header concise**: Under 72 characters
3. **Be specific**: Clearly state what changed and why
4. **List all significant changes**: Don't group unrelated changes
5. **Reference issues**: Include issue numbers when applicable (e.g., "Fixes #123")

### Setting Up the Commit Template

To automatically use our commit template:

```bash
git config commit.template .gitmessage
```

This will load the template every time you create a commit, making it easier to follow our format.

## Questions?

If you have questions about these guidelines or suggestions for improvement, please open an issue or discussion.