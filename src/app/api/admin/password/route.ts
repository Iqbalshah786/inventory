import { NextResponse } from "next/server";
import argon2 from "argon2";
import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/admin";
import * as adminRepo from "@/lib/db/repositories/admin.repository";
import { success, error } from "@/lib/utils/api-response";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(error("Unauthorized"), { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        error(parsed.error.issues[0]?.message ?? "Validation failed"),
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const admin = await adminRepo.findByUsername(session.user.name!);
    if (!admin) {
      return NextResponse.json(error("User not found"), { status: 404 });
    }

    const isCurrentValid = await argon2.verify(admin.password, currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json(error("Current password is incorrect"), {
        status: 400,
      });
    }

    const hashedPassword = await argon2.hash(newPassword);
    await adminRepo.updatePassword(admin.id, hashedPassword);

    return NextResponse.json(success(null, "Password updated successfully"));
  } catch (err) {
    console.error("Password update error:", err);
    return NextResponse.json(error("Failed to update password"), {
      status: 500,
    });
  }
}
