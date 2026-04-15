import { writeFile, readFile, rm, mkdir } from "fs/promises";
import { STATE_FILE, CAPTCHA_IMAGES_DIR } from "./types";
import type { CaptchaState } from "./types";
import { existsSync } from "fs";

export async function saveState(state: CaptchaState): Promise<void> {
  try {
    // ensure dir exists
    await mkdir(CAPTCHA_IMAGES_DIR, { recursive: true }).catch(() => {});
    await writeFile(STATE_FILE, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

export async function loadState(): Promise<CaptchaState | null> {
  try {
    if (!existsSync(STATE_FILE)) return null;
    const content = await readFile(STATE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function clearState(): Promise<void> {
  try {
    await rm(STATE_FILE, { force: true });
  } catch {}
}
