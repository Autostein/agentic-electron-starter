import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/main/persistence/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './tmp/agentic-electron-starter.dev.db',
  },
  strict: true,
  verbose: true,
});
