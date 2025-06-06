# ∴ bit → your stack sidekick
![Version](https://img.shields.io/github/package-json/v/bitbons-ai/bit?label=version) ![NPM](https://img.shields.io/npm/v/@bitbons.ai/bit) ![Issues](https://img.shields.io/github/issues/bitbons-ai/bit) ![Last Commit](https://img.shields.io/github/last-commit/bitbons-ai/bit) 

**Zero to Full-Stack in Seconds!** Create production-ready applications with a single command.

![Creating a project with bit](https://raw.githubusercontent.com/bitbons-ai/bit/refs/heads/main/bit-demo.gif)

## ✨ What's in the Box?

Bit sets you up with a modern, battle-tested stack:

- 🌿 **[Monorepo](https://monorepo.tools/)** - Simple, organized and scalable from day one (`apps/pb` and `apps/web`)
- 🐋 **[Docker](https://www.docker.com/)** - Development environment that "just works"
- 📦 **[PocketBase Backend](https://pocketbase.io/)** - Full-featured backend with admin UI
- ✨ **[Astro Frontend](https://astro.build/)** - Blazing-fast web performance for pages and api endpoints (SSR by default on `bit`)
- 🍞 **[Bun](https://bun.sh/)** - Incredibly fast JavaScript runtime and toolkit for modern web development (powers bit's DX)

## 🚀 Get Started in 30 Seconds

1. Install Bit:

   ```bash
   npm i -g @bitbons.ai/bit
   ```

2. Create your masterpiece:

   ```bash
   bit new my-awesome-project
   cd my-awesome-project
   ```

3. Start to see logs coming in:
   ```bash
   bit logs # bit is already running both containers for you
   ```

**That's it!** Visit your creation at:

- ✨ Frontend: http://localhost:4321
- 👔 PocketBase Admin Dashboard: http://localhost:8090/\_/

![Screenshot of default webapp](https://raw.githubusercontent.com/bitbons-ai/bit/refs/heads/main/bit-web.webp)

## 🎮 Command Center

### During Development

| Command                    | Description                          |
|---------------------------|--------------------------------------|
| `new [options] <project-name>` | Create a new project [--pb <version>] [--astro <version>]|
| `bit start`               | Start development environment        |
| `bit stop`                | Stop all services                    |
| `bit restart [--skip-build] [target]`    | Restart and rebuild services [web, pb, empty for all]         |
| `bit logs`                | View containers logs                 |
| `bit down`                | Delete all containers and volumes    |
| `bit help [command]`      | If you need help remembering how to do it    |

### Ready for the World?

| Command          | What it Does                                |
| ---------------- | ------------------------------------------ |
| `bit deploy`     | Ship everything (parallel deployment). Same as `bit deploy all`       |
| `bit deploy web` | Ship frontend                              |
| `bit deploy pb`  | Ship backend                               |
| `bit deploy --watch`  | Wait and verify the deployment is healthy |
| `bit deploy --dry-run`  | Show what would happen without making any changes |

If your app doesn't exist in [fly.io](https://fly.io), it will `launch` first, then `deploy`.
You can use `--watch` to verify deployment health.

## 📐 Project Blueprint

```
my-project/
├── .env.development    # Development-only variables (not committed)
├── apps/
│   ├── web/           # Astro frontend
│   │   ├── src/
│   │   ├── .env      # Public environment variables
│   │   └── fly.toml  # Frontend deploy config
│   └── pb/           # PocketBase backend
│       ├── pb_data/  # Database and storage
│       └── fly.toml  # Backend deploy config
├── docker-compose.yml # Development environment
└── README.md
```

## 🪄 Power User Features

### Auto-Magic Admin Setup

Create `~/.bit.conf` to use one email/password for PB's superuser (and to fastrack creation):

```json
{
  "pocketbase": {
    "admin": {
      "email": "pb-admin@your-domain.com",
      "password": "your-secure-password"
    }
  }
}
```

### 🚢 Deploy Like a Pro

For now, you can deploy in [fly.io](https://fly.io) automagically:

1. Get the fly.io CLI:

   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Log in:

   ```bash
   fly auth login
   ```

3. Ship it:
   ```bash
   bit deploy # From your project's root directory, to deploy both web and pb
   ```
   or
   ```bash
   bit deploy pb # Deploy PocketBase (db / backend) only
   bit deploy web # Deploy Astro (Frontend / api) only
   ```

### Deploying PocketBase to fly.io in real time

![Deploying to fly.io, real time](https://raw.githubusercontent.com/bitbons-ai/bit/refs/heads/main/bit-deploy-pb.gif)

> [!IMPORTANT]
> If you want to point your domain to the web app, Add a `CNAME` entry for your domain pointing to your fly.io web app, and add a free ssl certificate for the domain.
> [Here's how to do it in details](https://fly.io/docs/networking/custom-domain/).

## 🧑‍💻 For the Builders

Want to make Bit even better? Here's how:

```bash
git clone https://github.com/bitbonsai/bit.git
cd bit
npm install
npm link
bit new test-project # Test your changes
```

## 📋 Before You Start

Make sure you have:

- 🐋 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- ✈️ [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
- 🍞 [Bun](https://bun.sh/) (recommended) or npm

## 🆘 Need Help?

Common hiccups and quick fixes:

- 🐋 **Docker not running?** Fire up Docker Desktop
- 🔌 **Port conflicts?** Check if 4321 or 8090 are free
- 🔐 **Permission issues?** Double-check Docker permissions
- 🫧 **Start fresh?** Run `bun run clean`

## 🤝 Join the Community

Got ideas? Found a bug? We love pull requests!

## ⚖️ License

MIT License - go wild! See [LICENSE](LICENSE) for the fine print.
