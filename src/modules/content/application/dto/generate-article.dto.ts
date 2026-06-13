import { z } from "zod";

export const ArticleTypeSchema = z.enum([
  "HOW_TO",
  "LISTICLE",
  "COMPARISON",
  "CASE_STUDY",
  "OPINION",
  "NEWS",
]);

export const GenerateArticleInputSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  keywords: z.array(z.string()).min(1, "At least one keyword is required").max(10),
  contentType: z.enum(["ARTICLE", "PRODUCT_SHEET", "META", "LINKEDIN_POST", "FACEBOOK_POST"]),
  tone: z.string().optional(),
  wordCount: z.number().int().min(100).max(5000).optional(),
  articleType: ArticleTypeSchema.optional(),
  context: z.string().max(4000).optional(),
  authorId: z.string().uuid(),
  agencyId: z.string().uuid(),
});

export type GenerateArticleInput = z.infer<typeof GenerateArticleInputSchema>;
