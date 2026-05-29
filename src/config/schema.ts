import { z } from "zod";

export const ConfigSchema = z.object({
  provider: z.object({
    type: z.literal("openai-compatible").default("openai-compatible"),
    baseURL: z.string().url().optional(),
    model: z.string().min(1).optional()
  }).default({ type: "openai-compatible" }),
  image: z.object({
    maxSizeMB: z.number().positive().default(20),
    autoResize: z.boolean().default(true),
    maxWidth: z.number().int().positive().default(2000),
    maxHeight: z.number().int().positive().default(2000),
    stripExif: z.boolean().default(true),
    allowedExtensions: z.array(z.string()).default([".png", ".jpg", ".jpeg", ".webp"])
  }).default({}),
  output: z.object({
    defaultFormat: z.enum(["text", "json"]).default("text")
  }).default({}),
  cache: z.object({
    enabled: z.boolean().default(true),
    ttlDays: z.number().int().positive().default(30)
  }).default({}),
  database: z.object({
    path: z.string().default("~/.imgx/imgx.db")
  }).default({})
});

export type ImgxConfig = z.infer<typeof ConfigSchema>;

export type CliConfigOverrides = {
  config?: string;
  baseURL?: string;
  model?: string;
  dbPath?: string;
  timeoutMs?: number;
  maxImageMB?: number;
};
