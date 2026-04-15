import { defaultHeaders } from "./types";

export async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { headers: defaultHeaders });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch {
    return null;
  }
}
