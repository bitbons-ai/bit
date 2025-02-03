# {{name}}

## 🏗 Architecture

This is a monorepo project consisting of:

```text
/
├── apps/
│   ├── web/                # Astro application
│   │   ├── src/
│   │   │   ├── components/ # UI components
│   │   │   ├── css/        # Global and component styles
│   │   │   ├── layouts/    # Page layouts and templates
│   │   │   ├── lib/        # Shared utilities and helpers
│   │   │   └── pages/      # Application routes
│   │   ├── public/         # Static assets
│   │   ├── astro.config.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── pb/                 # PocketBase instance
│       ├── pb_data/        # Database files
│       └── Dockerfile
├── package.json
├── .env.development        # Environment variables for development
└── docker-compose.yml
```

## 🛠 Tech Stack

- [Astro](https://astro.build) - Web framework
- [PocketBase](https://pocketbase.io) - Database
- [Docker](https://www.docker.com) - Containerization

## 🔧 Configuration

### PocketBase Admin Credentials

You can set default PocketBase admin credentials in `~/.bit-conf.json`:

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

If this file exists, the CLI will use these credentials when creating new projects. Otherwise, it will prompt for credentials during project creation.

## 🧞 Development

The project uses Docker for local development. From the root directory:

```bash
bun run dev
```

This command will:
1. Start the PocketBase container
2. Start the Astro development server with hot reloading
3. Set up communication between the services

## 🔑 Environment Variables

The project uses two `.env.development` files:

### Root .env.development (for Docker Compose)
```env
SUPERUSER_EMAIL=your@email.com      # PocketBase admin email
SUPERUSER_PASSWORD=yourpassword     # PocketBase admin password
```

### apps/web/.env.development (for Astro)
```env
POCKETBASE_URL=http://localhost:8090  # PocketBase instance URL
```

These files are created automatically during project setup. Make sure to keep your credentials safe!

## 🚀 Deployment

The project includes separate Dockerfiles for development and production:

### Web Application
- Development: `apps/web/Dockerfile` 
  - Used by `docker-compose.yml` for local development
  - Includes hot reloading and development server
  - Sets `NODE_ENV=development`

- Production: `apps/web/Dockerfile.prod`
  - Multi-stage build for smaller image size
  - Pre-builds the Astro application
  - Sets `NODE_ENV=production`
  - Optimized for performance

To build for production:
```bash
docker build -f apps/web/Dockerfile.prod -t your-app-name/web:prod ./apps/web
```

### PocketBase
- Uses the same Dockerfile for both environments
- Data persistence through Docker volumes
- Automatically creates admin user on first run

Each app directory contains its own `fly.toml` for deployment configuration.
