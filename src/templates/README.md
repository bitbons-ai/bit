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
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your desired configuration
   - (Optional) Set up PocketBase admin credentials in `~/.bit.conf` (see Configuration section)

3. Start the development environment:
   ```bash
   bit start # Press Ctrl+C to detach and keep services running
   ```
   This will start both the Astro frontend and PocketBase backend in development mode.

4. Access your applications:
   - Frontend: [http://localhost:4321](http://localhost:4321)
   - PocketBase Admin: [http://localhost:8090/_/](http://localhost:8090/_/)
   - Default admin credentials: Check your `.env` file or `~/.bit.conf`

## 🏗 Project Structure

```text
/
├── apps/
│   ├── web/                # Astro frontend application
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── layouts/    # Page layouts and templates
│   │   │   ├── pages/      # Application routes
│   │   │   ├── css/        # Global styles and themes
│   │   │   └── lib/        # Shared utilities and helpers
│   │   ├── public/         # Static assets
│   │   └── fly.toml        # Fly.io deployment config
│   └── pb/                 # PocketBase backend
│       ├── pb_data/        # Database files (gitignored)
│       ├── pb_migrations/  # Database migrations
│       └── fly.toml        # Fly.io deployment config
├── docker-compose.yml      # Development environment setup
└── .env                    # Environment variables
```

## 🛠 Tech Stack

- **Frontend**: [Astro](https://astro.build) - Fast, modern web framework optimized for content-driven websites
- **Backend**: [PocketBase](https://pocketbase.io) - Open Source backend with real-time subscriptions, auth, and file storage
- **Development**: [Docker](https://www.docker.com) - Containerization for consistent development and deployment

## 🧞 Available Commands

All commands are run from the project root:

| Command | Description |
|---------|-------------|
| `bun install` | Install project dependencies |
| `bun run dev` | Start development environment |
| `bun run build` | Build for production |
| `bun run start` | Start containers |
| `bun run stop` | Stop containers |
| `bun run down` | Stop and remove containers |
| `bun run clean` | Remove all data (including volumes) |

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with these required variables:

```env
# PocketBase Configuration
SUPERUSER_EMAIL=admin@example.com      # Admin dashboard login
SUPERUSER_PASSWORD=your-password       # Admin dashboard password

# Additional configurations can be added here
```

### PocketBase Admin Setup

You can set default PocketBase admin credentials in `~/.bit.conf`:

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

These credentials will be used when creating new projects. If this file doesn't exist, you'll be prompted during project creation.

## 🐳 Docker Development

The development environment uses Docker Compose with these features:

- Hot reloading for the Astro application
- Automatic restart for PocketBase on changes
- Volume mounting for persistent data
- Exposed ports:
  - `4321`: Astro frontend (http://localhost:4321)
  - `8090`: PocketBase backend (http://localhost:8090)

### Troubleshooting

- If ports are already in use, stop other services using these ports or modify the port mappings in `docker-compose.yml`
- For permission issues with Docker volumes, ensure your user has appropriate Docker permissions
- To reset the development environment completely, use `bun run clean`

## 📦 Deployment

You have two options for deploying your application to fly.io:

#### Option 1: Using bit deploy (Recommended)

Simply run:
```bash
bit deploy
```

This will automatically:
1. Launch your applications on fly.io if they don't exist yet
2. Deploy both the frontend and backend
3. Set up the necessary configuration

#### Option 2: Manual Deployment

1. Install and authenticate with fly.io:
   ```bash
   # Install CLI
   curl -L https://fly.io/install.sh | sh
   
   # Login
   fly auth login
   ```

2. Create your applications:
   ```bash
   # Create frontend app
   cd apps/web
   fly launch --name your-app-web
   
   # Create backend app
   cd ../pb
   fly launch --name your-app-api
   ```

3. Update the application names in both `fly.toml` files to match your chosen names.

4. Deploy from the project root:
   ```bash
   bun run deploy
   ```

### Configuration Files

- `apps/web/fly.toml`: Astro frontend configuration
- `apps/pb/fly.toml`: PocketBase backend configuration

Remember to:
- Set up any required environment variables in the fly.io dashboard
- Configure your domains and SSL certificates if using custom domains.
