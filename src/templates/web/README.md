# {{name}} Web Application

## Development

To start the development server:

```bash
# Start both web and PocketBase
bit start

# If you need to restart (e.g., after dependency changes):
bit restart web          # Rebuild and restart web
bit restart --skip-build # Restart without rebuilding
```

## Deployment

Deploy options:

```bash
# Deploy both web and PocketBase (in parallel)
bit deploy

# Deploy only web application
bit deploy web

# Deploy and monitor health
bit deploy --watch

# Deploy only PocketBase
bit deploy pb
```

## Environment Variables

- `.env`: Public environment variables
- `.env.development`: Development-only variables (not committed)

## Project Structure

```
src/
├── components/ # Reusable UI components
├── layouts/    # Page layout components
├── pages/      # Application routes
└── css/        # Global styles
public/         # Static assets
```

## Commands Reference

| Command                    | Description                          |
|---------------------------|--------------------------------------|
| `bit start`               | Start development environment        |
| `bit stop`                | Stop all services                    |
| `bit restart [target]`    | Restart and rebuild services         |
| `bit restart --skip-build`| Restart without rebuilding           |
| `bit deploy`              | Deploy all services                  |
| `bit deploy --watch`      | Deploy and monitor health           |
