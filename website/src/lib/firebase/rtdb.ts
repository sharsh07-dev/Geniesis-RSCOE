import { rtdb } from "./index";
import { ref, set, get, update, remove, child, push, onValue, query, orderByChild, equalTo } from "firebase/database";

/**
 * Write/Overwrite data at a given path in Firebase Realtime Database
 */
export async function writeData<T>(path: string, data: T): Promise<void> {
  const dbRef = ref(rtdb, path);
  await set(dbRef, data);
}

/**
 * Push new item to a list at path in Realtime Database (generates unique key)
 */
export async function pushData<T>(path: string, data: T): Promise<string | null> {
  const listRef = ref(rtdb, path);
  const newItemRef = push(listRef);
  await set(newItemRef, data);
  return newItemRef.key;
}

/**
 * Read data snapshot once from path in Realtime Database
 */
export async function readData<T>(path: string): Promise<T | null> {
  const dbRef = ref(rtdb);
  const snapshot = await get(child(dbRef, path));
  if (snapshot.exists()) {
    return snapshot.val() as T;
  }
  return null;
}

/**
 * Update specific fields at path in Realtime Database
 */
export async function updateData(path: string, data: Record<string, unknown>): Promise<void> {
  const dbRef = ref(rtdb, path);
  await update(dbRef, data);
}

/**
 * Delete data at path in Realtime Database
 */
export async function deleteData(path: string): Promise<void> {
  const dbRef = ref(rtdb, path);
  await remove(dbRef);
}

/**
 * Subscribe to realtime updates at path
 */
export function listenToPath<T>(path: string, callback: (data: T | null) => void): () => void {
  const dbRef = ref(rtdb, path);
  const unsubscribe = onValue(dbRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as T) : null);
  });
  return unsubscribe;
}
