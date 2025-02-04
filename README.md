# 🌱 Bit - Better Install This

A modern project scaffolding tool that creates a full-stack development environment with:

- 🏗️ Monorepo structure
- 🐳 Docker Compose setup
- 🚀 PocketBase backend
- ⭐ Astro frontend

[![asciicast](https://asciinema.org/a/zEwYmYtq2uaBbeyG6FMzsWLoU.svg)](https://asciinema.org/a/zEwYmYtq2uaBbeyG6FMzsWLoU)

## 📦 Installation

```bash
npm install -g @mauricio.wolff/bit
```

## 🚀 Quick Start

1. Create a new project:
   ```bash
   bit new my-project && cd my-project
   ```

2. Choose your development mode:
   ```bash
   bit start    # Interactive mode (shows logs in terminal)
   # or
   bit daemon   # Daemon mode (runs in background)
   ```

Your project will be available at:
- Frontend: http://localhost:4321
- PocketBase Admin: http://localhost:8090/_/

## 🛠️ Commands

### Development

| Command | Description |
|---------|-------------|
| `bit new <project-name>` | Create a new project |
| `bit start` | Start development environment (interactive) |
| `bit daemon` | Start development environment (background mode) |
| `bit stop` | Stop development environment |

### Deployment

| Command | Description |
|---------|-------------|
| `bit deploy` | Deploy both frontend and backend (auto-launches if needed) |
| `bit deploy web` | Deploy only frontend |
| `bit deploy pb` | Deploy only backend |

## 📁 Project Structure

```
my-project/
├── apps/
│   ├── web/          # Astro frontend
│   │   ├── src/
│   │   └── fly.toml  # Frontend deployment config
│   └── pb/           # PocketBase backend
│       ├── pb_data/
│       ├── pb_migrations/
│       └── fly.toml   # Backend deployment config
├── docker-compose.yml # Development environment
└── README.md
```

## ⚙️ Configuration

### PocketBase Admin Setup

You can set default PocketBase admin credentials in `~/.bit.conf`:

```json
{
  "pocketbase": {
    "admin": {
      "email": "your@email.com",
      "password": "your-secure-password"
    }
  }
}
```

If not set, you'll be prompted during project creation.

### Deployment Configuration

Bit uses [fly.io](https://fly.io) for deployment. The first time you deploy:

1. Install fly.io CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to fly.io:
   ```bash
   fly auth login
   ```

3. Deploy your project:
   ```bash
   bit deploy
   ```

This will automatically:
- Launch your apps on fly.io if they don't exist
- Deploy both frontend and backend
- Set up necessary configuration

## 🔨 Development

Want to contribute to bit? Here's how to set up the development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/bitbonsai/bit.git
   cd bit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the CLI for local development:
   ```bash
   npm link
   ```

4. Create a test project:
   ```bash
   bit new test-project
   ```

Now you can make changes to the bit source code and test them in your test project.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run tests |
| `npm link` | Link CLI for local development |
| `npm unlink` | Remove CLI link |

## 🔧 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) (for deployment)
- [Bun](https://bun.sh/) (recommended) or npm

## ❗ Troubleshooting

Common issues and solutions:

- **Docker not running**: Ensure Docker Desktop is running before starting your project
- **Port conflicts**: Check that ports 4321 (Astro) and 8090 (PocketBase) are available
- **Permission issues**: For Docker volume permission issues, ensure your user has appropriate Docker permissions
- **Reset environment**: Use `bun run clean` to completely reset the development environment

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details
