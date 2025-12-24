# Contributing to monimejs

Thank you for your interest in contributing to monimejs! This guide outlines the process for setting up your development environment, making changes, and submitting contributions.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/monimejs.git
   cd monimejs
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/atisans/monimejs.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
# Full build (JS + Types)
npm run build

# Clean build (removes dist/ first)
npm run build:clean

# Build only JavaScript
npm run build:js

# Build only Type Declarations
npm run build:types
```

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run format` | Format code with Biome |
| `npm run format:check` | Check formatting without changes |
| `npm run build:clean` | Clean build (recommended before commits) |

---

## Code Standards

### TypeScript & Strict Mode

- All main source code must be **TypeScript** with strict type checking enabled
- use snake_case for internal code (any code that the consumer does not use)
- Use explicit types; avoid `any`
- Follow the `tsconfig.json` configuration
- Use `const` and `let`; avoid `var`

### Formatting

We use **Biome** for formatting and linting _(Configuration is in `[biome.json](./biome.json)`)_. Before committing:

```bash
npm run format
```

### Code Style Guidelines

1. **File Structure**:
   - Core client logic: `client.ts`
   - HTTP handling: `http-client.ts`
   - Type definitions: `types.ts`
   - Input schemas/validation: `schemas.ts`, `validation.ts`
   - Error classes: `errors.ts`
   - Feature modules: `payment.ts`, `payout.ts`, etc.

2. **Naming Conventions**:
   - Classes: `PascalCase` (e.g., `MonimeClient`)
   - Functions/methods: `camelCase` (e.g., `createPayment`) internal functions/methods, variables should be snake_case
   - Constants: `UPPER_SNAKE_CASE` (for constants)
   - Types/Interfaces: `PascalCase` (e.g., `PaymentResponse`)

3. **Error Handling**:
   - Throw typed error classes from `errors.ts`
   - Use specific error types: `MonimeApiError`, `MonimeValidationError`, `MonimeTimeoutError`, `MonimeNetworkError`
   - Include descriptive messages and context

4. **Validation**:
   - Use Valibot schemas for input validation
   - Schemas defined in `schemas.ts`
   - Validation functions in `validation.ts`

5. **Documentation**:
   - Add JSDoc comments to public methods
   - Include parameter types and return types
   - Document complex logic with inline comments or make the logic self-explanatory

---

## Making Changes

### Branch Naming

Use descriptive branch names:
```bash
git checkout -b feature/add-checkout-session
git checkout -b fix/timeout-handling
git checkout -b docs/update-readme
```

### Commit Messages

Write clear, concise commit messages:
```
feature: add webhook retry mechanism
fix: handle network timeout gracefully
docs: add AbortController example
```

Use conventional commit format when possible.

### Testing Your Changes

1. **Build locally**:
   ```bash
   npm run build:clean
   ```

2. **Check formatting**:
   ```bash
   npm run format:check
   ```

3. **Fix formatting issues**:
   ```bash
   npm run format
   ```

4. **Verify no TypeScript errors**:
   ```bash
   npm run build
   ```

---

## Submitting Changes

### Push and Create a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub:
   - Reference any related issues
   - Describe your changes clearly
   - Link to any relevant documentation or examples

3. Ensure all checks pass:
   - GitHub Actions CI workflow runs successfully
   - All formatting is correct
   - TypeScript compiles without errors

### Pull Request Guidelines

- **Keep PRs focused**: One feature or fix per PR
- **Update documentation**: If your change affects public APIs, update `README.md` or `docs/FEATURE_REFERENCE.md`
- **Include examples**: For new features, provide usage examples
- **Be responsive**: Address feedback and review comments promptly

---

## Release Process

### Automated via GitHub Actions

Once your PR is merged to `main`:

1. The release workflow triggers automatically
2. A "Release PR" is created with:
   - Updated version in `package.json`
   - Generated changelog based on changesets
3. When the Release PR is merged:
   - Package is built
   - Published to npm with provenance signature
   - GitHub release is created with changelog

### Version Numbers

We follow **Semantic Versioning** (optional):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **MAJOR**: Breaking API changes
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes

---

## Questions or Issues?

- Open a GitHub issue for bugs or feature requests
- Check existing issues before opening a new one
- Use clear, descriptive titles and include reproduction steps

Thank you for contributing to monimejs.
