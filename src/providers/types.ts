export type VisionRequestInput = {
  baseURL: string;
  model: string;
  apiKey: string;
  prompt: string;
  dataUrl: string;
  timeoutMs: number;
};

export type VisionProviderResult = {
  raw: unknown;
  latencyMs: number;
};

