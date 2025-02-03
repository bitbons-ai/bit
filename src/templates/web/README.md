# {{name}} Web Application

## Development

To start the development server:

```bash
bun dev
```

## Deployment

Deploy options:

```bash
# Deploy both web and PocketBase
bit deploy

# Deploy only web application
bit deploy web

# Deploy only PocketBase
bit deploy pb
```

## Project Structure

- `src/pages/`: Application routes
- `src/components/`: Reusable UI components
- `src/layouts/`: Page layout components
- `public/`: Static assets

## Environment Variables

Configure your environment variables in `.env` file:

- `POCKETBASE_URL`: URL of your PocketBase instance
- `NODE_ENV`: Set to `production` for production builds

## Building for Production

```bash
bun run build
```

## Fly.io Deployment

The application is configured to deploy on Fly.io with:
- Automatic HTTPS
- Minimal 1 machine running
- 1GB memory

## Troubleshooting

- Ensure Bun is installed: `curl -fsSL https://bun.sh/install | bash`
- Check PocketBase connection in the admin dashboard
