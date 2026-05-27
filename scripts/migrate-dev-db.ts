import path from 'node:path';
import { closeMainDatabase, initializeMainDatabase } from '../src/infrastructure/main/persistence/db/client';

const userDataPath = path.join(process.cwd(), 'tmp', 'dev-user-data');

const runtime = initializeMainDatabase({
  userDataPath,
  resourcesPath: process.cwd(),
  isPackaged: false,
});

console.log(`Migrated development database at ${runtime.dbPath}`);
closeMainDatabase();
