# 🌱 bit

> Better Install This

[![npm version](https://badge.fury.io/js/%40mauricio.wolff%2Fbit.svg)](https://www.npmjs.com/package/@mauricio.wolff/bit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Built by [BitBonsai](https://github.com/bitbonsai)

## What's this?

Just a tiny tool to help you spin up web projects faster. No magic, just convenience.

## Installation

```bash
npm install -g @mauricio.wolff/bit

# Check installation
bit version
```

## Quick Start

### Create a project

```bash
bit new my-cool-project
```

### Start development environment

```bash
bit start
```

### Deploy to production

```bash
bit deploy
```

## What You Get

- 🚀 Astro.js project (latest version)
- 📦 PocketBase database
- 🐳 Docker setup
- 🚢 fly.io deployment config
- 🧪 Testing setup
- 🔄 Auto-update system

## Commands That Actually Work

### Project Commands
- `bit new` - Start a new project
- `bit dev` - Run local development
- `bit deploy` - Ship it to production

### Docker Commands
- `bit docker build` - Build Docker image
- `bit docker up` - Start container
- `bit docker down` - Stop container
- `bit docker logs [-f]` - Show container logs (use -f to follow)
- `bit docker shell` - Access container shell

### Database Commands
- `bit db studio` - Open PocketBase Admin UI
- `bit db backup` - Create database backup
- `bit db migrate` - Create new migration

### PocketBase Commands
- `bit pb setup` - First-time PocketBase setup
- `bit pb start` - Start PocketBase
- `bit pb stop` - Stop PocketBase
- `bit pb cleanup [--all] [--data]` - Clean up containers and data

### System Commands
- `bit version` - Show current version
- `bit upgrade` - Upgrade to latest version

## Project Structure

```
my-project/
├── apps/
│   ├── web/    # Your Astro app
│   └── pb/     # PocketBase setup
│       ├── pb_data/
│       ├── pb_migrations/
│       ├── pb_hooks/
│       ├── Dockerfile
│       └── package.json
└── .github/
    └── workflows/
        └── deploy_pocketbase.yml  # Automated deployment
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm run test:pb          # PocketBase tests
npm run test:docker      # Docker tests
npm run test:new         # Project creation tests

# Watch mode for development
npm run test:watch

# Clean test environment
npm run test:clean
```

### Test Coverage
- ✅ Project creation
- ✅ PocketBase operations
- ✅ Docker commands
- ✅ Database management
- ✅ Version control
- ✅ Upgrade process

## Automated Deployment

Our GitHub Actions workflow automates the deployment of your PocketBase backend to fly.io. Here's what it does:

- 🔍 Triggers on pushes to the `main` branch
- 🚢 Deploys only when changes are made to the PocketBase directory
- 🛡️ Uses a secure, revocable deployment token
- 🤖 Completely hands-off deployment process

### Workflow Configuration

```yaml
name: Deploy PocketBase
on:
  push:
    branches: [main]
    paths:
      - "apps/pb/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
```

## Setting Up Deployment Token

1. Generate a fly.io deployment token

```bash
fly tokens create deploy
```

2. Add the token to your GitHub repository:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets → Actions
   - Create a new repository secret
   - Name the secret: `FLY_API_TOKEN`
   - Paste the token from fly.io

## Troubleshooting

### Port Conflicts
If you see port conflict errors:
```bash
bit pb stop          # Stop existing PocketBase
bit pb cleanup       # Clean up containers
bit pb start         # Start fresh
```

### Container Issues
For Docker-related issues:
```bash
bit docker cleanup   # Remove problematic containers
bit docker build     # Rebuild image
bit docker up        # Start fresh
```

## Why Another Tool?

Because setting up projects shouldn't feel like homework.

## Contributing

Found a bug? Open an issue.

Want a feature? Send a PR.

No complicated guidelines. Just be cool.

## License

MIT © BitBonsai
