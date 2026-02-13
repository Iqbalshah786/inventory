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

export async function findById(id: number): Promise<Admin | null> {
  const rows = await query<Admin>(
    "SELECT id, username, password FROM admin WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export async function updatePassword(
  id: number,
  newHashedPassword: string,
): Promise<void> {
  await query("UPDATE admin SET password = $1 WHERE id = $2", [
    newHashedPassword,
    id,
  ]);
}
