import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changeUsernameSchema } from "@/lib/validations/admin";
import * as adminRepo from "@/lib/db/repositories/admin.repository";
import { success, error } from "@/lib/utils/api-response";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(error("Unauthorized"), { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = changeUsernameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        error(parsed.error.issues[0]?.message ?? "Validation failed"),
        { status: 400 },
      );
    }

    const { newUsername } = parsed.data;

    // Check if username is already taken
    const existing = await adminRepo.findByUsername(newUsername);
    if (existing && String(existing.id) !== session.user.id) {
      return NextResponse.json(error("Username is already taken"), {
        status: 409,
      });
    }

    await adminRepo.updateUsername(Number(session.user.id), newUsername);

    return NextResponse.json(
      success({ username: newUsername }, "Username updated successfully"),
    );
  } catch (err) {
    console.error("Username update error:", err);
    return NextResponse.json(error("Failed to update username"), {
      status: 500,
    });
  }
}
