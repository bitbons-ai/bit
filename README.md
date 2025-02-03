# bit CLI

A modern project scaffolding tool that creates a full-stack development environment with:
- Monorepo structure
- Docker Compose setup
- PocketBase integration
- Astro app with a clean folder structure

## Installation

```bash
npm install -g bit-cli
```

## Usage

### Create a new project
```bash
bit new my-project
```

### Start development environment
```bash
bit start
```

### Deploy your project
```bash
bit deploy
```

## Features

- 🏗️ **Monorepo Structure**: Organized project layout for multiple packages
- 🐳 **Docker Compose**: Pre-configured development environment
- 🚀 **PocketBase**: Integrated backend with authentication and database
- ⭐ **Astro**: Modern frontend with optimal performance
- 💅 **Clean UI**: Beautiful command-line interface with progress indicators

## Project Structure

```
my-project/
├── packages/
│   ├── frontend/     # Astro application
│   └── shared/       # Shared utilities
├── pocketbase/
│   ├── pb_data/
│   ├── pb_migrations/
│   └── pb_hooks/
├── docker-compose.yml
└── README.md
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Link the CLI: `npm link`
4. Run `bit` to see available commands

## License

MIT
