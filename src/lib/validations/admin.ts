import { z } from "zod/v4";

export const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(150, "Username must be at most 150 characters"),
});

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(150, "New password must be at most 150 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
