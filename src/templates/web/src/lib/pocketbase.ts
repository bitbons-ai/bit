import PocketBase from 'pocketbase';

const PB_URL = import.meta.env.POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

export function createClient(): PocketBase {
  return new PocketBase(PB_URL);
}