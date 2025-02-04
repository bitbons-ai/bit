# {{name}}

> **Note**: While we recommend using [bun](https://bun.sh) as the package manager for optimal performance, you can also use npm or pnpm if you prefer. Simply replace `bun` with your preferred package manager in the commands.

## 🚀 Quick Start

1. Start the development environment:
   ```bash
   bun run dev
   ```
   This will start both the Astro frontend and PocketBase backend in development mode.

2. Access your applications:
   - Frontend: [http://localhost:4321](http://localhost:4321)
   - PocketBase Admin: [http://localhost:8090/_/](http://localhost:8090/_/)

## 🏗 Project Structure

```text
/
├── apps/
│   ├── web/                # Astro frontend application
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── layouts/    # Page layouts and templates
│   │   │   ├── pages/      # Application routes
│   │   │   ├── css/        # Styles and themes
│   │   │   └── lib/        # Shared utilities and helpers
│   │   └── public/         # Static assets
│   └── pb/                 # PocketBase backend
│       ├── pb_data/        # Database files (gitignored)
│       └── pb_migrations/  # Database migrations
├── docker-compose.yml      # Development environment setup
└── .env                    # Environment variables
```

## 🛠 Tech Stack

- **Frontend**: [Astro](https://astro.build) - The web framework for content-driven websites
- **Backend**: [PocketBase](https://pocketbase.io) - Open Source backend in 1 file
- **Development**: [Docker](https://www.docker.com) - Container platform

## 🧞 Available Commands

From the project root:

| Command           | Action                                           |
|:-----------------|:------------------------------------------------|
| `bun run dev`    | Start development environment                    |
| `bun run daemon` | Start in detached mode                          |
| `bun run build`  | Build Docker images                             |
| `bun run start`  | Start existing containers                       |
| `bun run stop`   | Stop containers                                 |
| `bun run down`   | Stop and remove containers                      |
| `bun run clean`  | Stop containers and remove volumes              |

## ⚙️ Configuration

### Environment Variables

The project uses a single `.env` file in the root directory:

```env
SUPERUSER_EMAIL=admin@example.com      # PocketBase admin email
SUPERUSER_PASSWORD=your-password       # PocketBase admin password
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

If this file exists, these credentials will be used when creating new projects. Otherwise, you'll be prompted during project creation.

## 🐳 Docker Development

The development environment uses Docker Compose with the following features:

- Hot reloading for the Astro application
- Automatic restart for PocketBase
- Volume mounting for persistent data
- Port mapping:
  - `4321`: Astro frontend
  - `8090`: PocketBase backend

## 📦 Production Deployment

The project is configured for deployment to [fly.io](https://fly.io). Each application includes its own `fly.toml` configuration file.

### Deploy Commands

| Command                    | Action                                           |
|:-------------------------|:------------------------------------------------|
| `bun run deploy`         | Deploy both frontend and backend                |
| `bun run deploy:web`     | Deploy only the frontend                        |
| `bun run deploy:pb`      | Deploy only PocketBase                          |

### First-time Deployment

1. Install the [fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Login to fly.io:
   ```bash
   fly auth login
   ```
3. Create apps (if not already created):
   ```bash
   cd apps/web && fly launch
   cd ../pb && fly launch
   ```
4. Deploy both apps:
   ```bash
   bun run deploy
   ```

### Configuration Files

- `apps/web/fly.toml`: Astro frontend configuration
- `apps/pb/fly.toml`: PocketBase backend configuration

Make sure to update the app names in both `fly.toml` files to match your fly.io app names.
