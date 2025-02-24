# bit 2.3.1 (2025-02-24)
## 🐛 Bug Fixes
- Fixed create-astro version detection

# bit 2.3.0 (2025-02-21)

## ⭐️ Major Changes
- **New Commands**: Added `bit restart` command to rebuild and restart containers
  - Support for individual services (`bit restart web` or `bit restart pb`)
  - `--skip-build` option to restart without rebuilding
  - Parallel restart for 'all' target
- **Health Check**: Added health check feature with `--watch` flag for deployments
- **Parallel Deployment**: Added parallel deployment for 'all' target
- **Domain Support**: Added support for domain names in project creation
  - Allow using domains as project names (e.g., example.com)
  - Automatic conversion to fly.io compatible names
  - Consistent naming across Docker and deployment

## 🔧 Improvements
- **PocketBase Credentials**: Moved PocketBase credentials to `.env.development` in root directory
- **Dockerfile**: Improved Dockerfile with multi-stage builds and non-root user
- **Deploy Command**: Enhanced deploy command:
  - Auto-set fly secrets from `.env.development` during first deploy
  - Added custom domain guidance
  - Made all deployments non-interactive
  - Added --dry-run option for deployment simulation
  - Improved secret management from fly.secrets.example
  - Added DNS and SSL certificate setup instructions
- **Documentation**: Updated documentation:
  - Revised project structure in READMEs
  - Added new commands and options
  - Improved environment setup instructions

## 📦 Removed
- **Redundant Scripts**: Removed redundant scripts from root package.json
- **pb_migrations Folder**: Removed `pb_migrations` folder from template
- **start.sh Script**: Removed `start.sh` script in favor of direct CMD in Dockerfile

## 🔒 Security
- **Credential Management**: Improved credential management with `.env.development`
- **Container Security**: Enhanced container security with non-root user
- **Secrets Handling**: Better secrets handling in Fly.io deployments

# bit 2.2.2 (2025-02-17)

## ⭐️ Major Changes
- **Package Management**: Improved synchronization between local and container environments
  - Added automatic sync between local and container `node_modules`
  - Now running `bun install` both locally and in container
  - Packages installed locally are automatically available in container
  - No more need to rebuild container after installing new packages locally

## 🔧 Improvements
- **Project Root Detection**: Enhanced all CLI commands to work from any project subdirectory
  - Updated `start`, `stop`, `down`, `logs`, and `deploy` commands
  - Better error handling and consistent messaging
  - Improved path handling across all commands

- **PocketBase Integration**:
  - Replaced settings collection with health check endpoint for better reliability
  - Added comprehensive example for collection queries in `pocketbase.ts`
  - Updated connection status display with HTTP code
  - Improved error handling and type safety

- **Documentation**:
  - Added `bit down` command to CLI help menu
  - Added example code for PocketBase collection queries
  - Improved inline documentation and comments

## 🐛 Bug Fixes
- Fixed project root detection in CLI commands
- Fixed PocketBase connection status to use more reliable health check
- Fixed missing collection context error in web template

## 📚 Examples Added
- Added example for getting records from PocketBase collections
- Added TypeScript interfaces example for PocketBase records
- Added filtering and sorting examples for collection queries