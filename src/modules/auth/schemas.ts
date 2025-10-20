import z from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

const sitenameSchema = z
  .string()
  .transform((val) => val.toLowerCase())
  .pipe(
    z
      .string()
      .min(3, "Sitename must be at least 3 characters")
      .max(63, "Sitename must be less than 63 characters")
      .regex(
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
        "Sitename can only contain lowercase letters, numbers and hyphens. It must start and end with a letter or number"
      )
      .refine(
        (val) => !val.includes("--"),
        "Sitename cannot contain consecutive hyphens"
      )
  );

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(3),
  sitename: sitenameSchema,
});
