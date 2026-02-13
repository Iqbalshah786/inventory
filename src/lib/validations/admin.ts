import { z } from "zod/v4";

export const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(150, "Username must be at most 150 characters"),
});

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;
