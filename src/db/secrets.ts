import { openDb } from "./client.js";

const API_KEY_NAME = "provider.apiKey";
const BASE_URL_NAME = "provider.baseURL";
const MODEL_NAME = "provider.model";

export function saveApiKey(dbPath: string, apiKey: string): void {
  const db = openDb(dbPath);
  try {
    db.prepare("INSERT OR REPLACE INTO secrets (name, value, updated_at) VALUES (?, ?, ?)").run(API_KEY_NAME, apiKey, new Date().toISOString());
  } finally {
    db.close();
  }
}

export function saveProviderSettings(dbPath: string, input: { baseURL?: string; model?: string; apiKey?: string }): void {
  const db = openDb(dbPath);
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (name, value, updated_at) VALUES (?, ?, ?)");
    const now = new Date().toISOString();
    if (input.baseURL) stmt.run(BASE_URL_NAME, input.baseURL, now);
    if (input.model) stmt.run(MODEL_NAME, input.model, now);
    if (input.apiKey) db.prepare("INSERT OR REPLACE INTO secrets (name, value, updated_at) VALUES (?, ?, ?)").run(API_KEY_NAME, input.apiKey, now);
  } finally {
    db.close();
  }
}

export function readProviderSettings(dbPath: string): { baseURL?: string; model?: string; apiKey?: string } {
  const db = openDb(dbPath);
  try {
    const settings = db.prepare("SELECT name, value FROM settings WHERE name IN (?, ?)").all(BASE_URL_NAME, MODEL_NAME) as Array<{ name: string; value: string }>;
    const secret = db.prepare("SELECT value FROM secrets WHERE name = ?").get(API_KEY_NAME) as { value: string } | undefined;
    const out: { baseURL?: string; model?: string; apiKey?: string } = {};
    for (const row of settings) {
      if (row.name === BASE_URL_NAME) out.baseURL = row.value;
      if (row.name === MODEL_NAME) out.model = row.value;
    }
    out.apiKey = secret?.value;
    return out;
  } finally {
    db.close();
  }
}

export function readApiKey(dbPath: string): string | undefined {
  const db = openDb(dbPath);
  try {
    const row = db.prepare("SELECT value FROM secrets WHERE name = ?").get(API_KEY_NAME) as { value: string } | undefined;
    return row?.value;
  } finally {
    db.close();
  }
}

export function deleteApiKey(dbPath: string): boolean {
  const db = openDb(dbPath);
  try {
    const result = db.prepare("DELETE FROM secrets WHERE name = ?").run(API_KEY_NAME);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

export function deleteProviderSettings(dbPath: string): number {
  const db = openDb(dbPath);
  try {
    const settings = db.prepare("DELETE FROM settings WHERE name IN (?, ?)").run(BASE_URL_NAME, MODEL_NAME).changes;
    const secrets = db.prepare("DELETE FROM secrets WHERE name = ?").run(API_KEY_NAME).changes;
    return settings + secrets;
  } finally {
    db.close();
  }
}
