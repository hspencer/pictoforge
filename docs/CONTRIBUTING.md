# Contributing to PictoForge

We welcome contributions to PictoForge. This guide explains how to contribute to this web-based SVG editor project.

> **EARLY DEVELOPMENT NOTICE**  
> PictoForge is in early development. Many features are still being implemented. Your contributions can help shape the project’s direction.

## Table of Contents

- Code of Conduct
- Getting Started
- Development Setup
- How to Contribute
- Development Guidelines
- Commit Message Guidelines
- Pull Request Process
- Issue Guidelines
- Testing
- Documentation

## Code of Conduct

This project adheres to a code of conduct adapted from the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to:

- Be respectful and inclusive in all interactions  
- Provide constructive feedback  
- Focus on the project’s goals  
- Assist others in learning and growing  

## Getting Started

### Prerequisites

- Node.js 18+ and npm or yarn  
- Git for version control  
- Modern web browser for testing  
- Basic knowledge of JavaScript (ES6+), Sass, and SVG  

### Setup

1. Fork the repository on GitHub  
2. Clone your fork locally:  
   ```bash
   git clone https://github.com/yourusername/pictoforge.git
   cd pictoforge
   ```
3. Install dependencies:  
   ```bash
   npm install
   ```
4. Start the development server:  
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`

## How to Contribute

Areas where help is needed:

- Core architecture and event system  
- SVG parsing and linting  
- UI components and layout  
- Accessibility improvements  
- Documentation and examples  
- Testing and CI configuration  
- Bug reports and fixes  

Types of contributions:

- Bug fixes  
- New features aligned with the roadmap  
- Documentation improvements  
- Test coverage enhancements  
- Performance optimizations  

## Development Guidelines

### Project Structure

```
src/
├── core/          # Core logic (parser, linter, virtual DOM)
├── ui/            # User interface components
├── utils/         # Shared utilities
└── styles/        # Sass stylesheets
```

### Coding Standards

JavaScript

- Use modern ES6+ syntax and modules  
- CamelCase for variables and functions  
- PascalCase for classes and constructors  
- JSDoc comments for public APIs  
- Handle errors gracefully  

Sass

- Follow BEM naming conventions  
- Use CSS custom properties for theming  
- Place variables in `_variables.scss`  
- One stylesheet per component  

SVG Handling

- Preserve `<title>` and `<desc>` for accessibility  
- Ensure well-formed XML and correct namespaces  
- Optimize for large SVG files  

Event System

- Use the EventBus for cross-module communication  
- Emit and listen to named events clearly  
- Keep handlers focused on single responsibilities  

## Commit Message Guidelines

Follow the Conventional Commits specification:

Format:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature  
- `fix`: Bug fix  
- `docs`: Documentation changes  
- `style`: Formatting or code style changes  
- `refactor`: Code refactoring  
- `test`: Add or update tests  
- `chore`: Maintenance tasks  

Examples:
```
feat(parser): add SVG namespace validation
fix(ui): resolve element selection sync issue
docs(api): update EventBus documentation
test(svgParser): add tests for invalid SVG input
```

## Pull Request Process

1. Fork the repository and create a new branch:  
   ```bash
   git checkout -b feature/your-feature
   ```
2. Commit your changes with clear messages.  
3. Push your branch to your fork:  
   ```bash
   git push origin feature/your-feature
   ```
4. Open a pull request against `main`.  
5. Address feedback and update your PR as needed.  

## Issue Guidelines

- Provide a clear title and description.  
- Include steps to reproduce bugs.  
- Attach screenshots or code snippets when applicable.  
- Reference related issues or PRs.  

## Testing

- Write unit tests for core logic and components.  
- Follow existing test patterns and naming conventions.  
- Run tests before committing:  
  ```bash
  npm run test
  ```

## Documentation

- Update `docs/ARCHITECTURE.md`, `docs/API.md`, and other docs as needed.  
- Use clear examples and code snippets.  

Thank you for contributing to PictoForge!