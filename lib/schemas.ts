import { z } from "zod";

export const authSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password is too long"),
});

export type AuthFormValues = z.infer<typeof authSchema>;

function isAtLeast18(dateString: string) {
  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
}

export const profileEditSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name is too long"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Only letters, numbers, dots and underscores are allowed",
    ),
  gender: z.enum(["male", "female", "other"], {
    message: "Please select a gender",
  }),
  birthdate: z
    .string()
    .min(1, "Birthday is required")
    .refine(isAtLeast18, "You must be at least 18 years old"),
  bio: z.string().max(500, "Bio must be 500 characters or fewer"),
  avatar_url: z.string().optional().or(z.literal("")),
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
