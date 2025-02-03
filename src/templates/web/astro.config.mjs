// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import icon from "astro-icon";

export default defineConfig({
  integrations: [icon()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@lib': '/src/lib',
        '@css': '/src/css'
      }
    }
  }
});
