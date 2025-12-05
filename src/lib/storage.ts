import { openDB, type DBSchema } from 'idb';

interface TopologyDB extends DBSchema {
  topologies: {
    key: string;
    value: any; // Using any for now, will be typed with Topology schema later
  };
}

const DB_NAME = 'network-simulator-db';
const STORE_NAME = 'topologies';

export async function initDB() {
  return openDB<TopologyDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveTopology(id: string, data: any) {
  const db = await initDB();
  await db.put(STORE_NAME, data, id);
}

export async function loadTopology(id: string) {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function getAllTopologies() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}
