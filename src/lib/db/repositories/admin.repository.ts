import { query } from "@/lib/db/connection";
import type { Admin } from "@/types";

export async function findByUsername(username: string): Promise<Admin | null> {
  const rows = await query<Admin>(
    "SELECT id, username, password FROM admin WHERE username = $1",
    [username],
  );
  return rows[0] ?? null;
}

export async function updateUsername(
  id: number,
  newUsername: string,
): Promise<void> {
  await query("UPDATE admin SET username = $1 WHERE id = $2", [
    newUsername,
    id,
  ]);
}
