const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters required")
  .max(72, "Maximum 72 characters (bcrypt limit)")
  .regex(/[A-Z]/, "At least one uppercase letter required")
  .regex(/[0-9]/, "At least one number required");
const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: passwordSchema,
  displayName: z.string().min(2, "Display name too short").max(50).trim(),
  country: z
    .string()
    .length(2, "Country must be a 2-letter ISO code")
    .toUpperCase()
    .optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9_]+$/,
      "Username: lowercase letters, numbers, underscores only",
    )
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token required"),
  country: z.string().length(2).toUpperCase().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).trim().optional(),
  country: z.string().length(2).toUpperCase().optional(),
  favoriteTeam: z.string().max(100).trim().optional(),
  settings: z
    .object({
      notifications: z
        .object({
          daily: z.boolean().optional(),
          achievements: z.boolean().optional(),
        })
        .optional(),
      language: z.string().optional(),
      theme: z.enum(["light", "dark", "auto"]).optional(),
    })
    .optional(),
});

const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});

const answerSubmitSchema = z.object({
  questionId: z.string().min(1, "questionId required"),
  selectedAnswer: z.enum(["A", "B", "C", "D"]),
  timeSpentMs: z
    .number()
    .int()
    .positive("timeSpentMs must be a positive integer"),
});

const createWidgetSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  siteName: z.string().max(100).trim().optional(),
  siteUrl: z.string().url().optional(),
  allowedOrigins: z.array(z.string().url()).max(20).optional(),
  plan: z.enum(["starter", "pro"]).optional(),
  config: z
    .object({
      questionCategories: z.array(z.string()).optional(),
      questionsPerSession: z.number().int().min(1).max(20).optional(),
      showLeaderboard: z.boolean().optional(),
      language: z.string().optional(),
      welcomeMessage: z.string().max(200).optional(),
    })
    .optional(),
});

const bulkQuestionsSchema = z.array(
  z.object({
    text: z.string().min(1),
    options: z.object({
      A: z.string().min(1),
      B: z.string().min(1),
      C: z.string().min(1),
      D: z.string().min(1),
    }),
    correctAnswer: z.enum(["A", "B", "C", "D"]),
    explanation: z.string().optional(),
    category: z.enum([
      "history",
      "stats",
      "players",
      "venues",
      "rules",
      "culture",
      "wc2026",
    ]),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    tags: z.array(z.string()).optional(),
    year: z.number().int().optional(),
  }),
);

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  pushTokenSchema,
  answerSubmitSchema,
  createWidgetSchema,
  bulkQuestionsSchema,
};
