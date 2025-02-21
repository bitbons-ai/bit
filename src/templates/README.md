# {{name}}

> **Note**: While we recommend using [bun](https://bun.sh) as the package manager for optimal performance, you can also use npm or pnpm if you prefer. Simply replace `bun` with your preferred package manager in the commands.

## 📋 Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Bun](https://bun.sh) (recommended), [Node.js](https://nodejs.org) with npm, or [pnpm](https://pnpm.io)
- [fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) (for deployment only)

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up your environment:
   - The `.env.development` file in the root contains development-specific variables
   - Update the values if needed (PocketBase admin credentials, etc.)
   - (Optional) Set up default PocketBase admin credentials in `~/.bit.conf`

3. Start the development environment:
   ```bash
   bit start # Press Ctrl+C to detach and keep services running
   ```
   This will start both the Astro frontend and PocketBase backend in development mode.

4. Access your applications:
   - Frontend: [http://localhost:4321](http://localhost:4321)
   - PocketBase Admin: [http://localhost:8090/_/](http://localhost:8090/_/)
   - Default admin credentials are in `.env.development`

## 🏗 Project Structure

```text
/
├── .env.development     # Development-only variables (not committed)
├── apps/
│   ├── web/            # Astro frontend application
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── layouts/    # Page layouts and templates
│   │   │   ├── pages/      # Application routes
│   │   │   ├── css/        # Global styles and themes
│   │   │   └── lib/        # Shared utilities and helpers
│   │   ├── public/         # Static assets
│   │   ├── .env           # Public environment variables
│   │   └── fly.toml       # Fly.io deployment config
│   └── pb/               # PocketBase backend
│       ├── pb_data/      # Database files (gitignored)
│       └── fly.toml      # Fly.io deployment config
├── docker-compose.yml   # Development environment
└── README.md
```

## 🛠 Development Commands

| Command                    | Description                          |
|---------------------------|--------------------------------------|
| `bit start`               | Start development environment        |
| `bit stop`                | Stop all services                    |
| `bit restart [target]`    | Restart and rebuild services         |
| `bit logs`                | View containers logs                 |
| `bit down`                | Delete all containers and volumes    |

### Useful Options
| Command                     | Description                          |
|----------------------------|--------------------------------------|
| `bit restart --skip-build` | Restart without rebuilding           |

## 🚀 Deployment

1. Make sure you have a [fly.io](https://fly.io) account and are logged in:
   ```bash
   fly auth login
   ```

2. Deploy your applications:
   ```bash
   bit deploy        # Deploy both frontend and backend
   bit deploy web    # Deploy only frontend
   bit deploy pb     # Deploy only backend
   ```

   Use `--watch` to verify deployment health:
   ```bash
   bit deploy --watch
   ```

## 📝 Configuration

### PocketBase Admin Setup

You can set default admin credentials in `~/.bit.conf`:

```json
{
  "pocketbase": {
    "admin": {
      "email": "admin@example.com",
      "password": "your-secure-password"
    }
  }
}
```

## 🤝 Contributing

Pull requests are welcome! Feel free to contribute to this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
