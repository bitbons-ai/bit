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