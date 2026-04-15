import * as cheerio from "cheerio";
import * as pureimage from "pureimage";
import { Readable, PassThrough } from "stream";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { CAPTCHA_IMAGES_DIR, defaultHeaders } from "./types";
import type { CaptchaState } from "./types";
import { fetchImage } from "./fetch";

export async function loadOverlay() {
  // Use process.cwd() to get project root (where assets folder is)
  const overlayPath = path.join(process.cwd(), "assets", "captcha-overlay.png");
  const file = await readFile(overlayPath);
  const readable = new Readable();
  readable.push(file);
  readable.push(null);
  return pureimage.decodePNGFromStream(readable);
}

export async function handleCaptcha(challenge: string, images: string[]): Promise<void> {
  console.log("\n⚠️  CAPTCHA required to continue.\n");
  console.log(`Challenge: "${challenge}"\n`);
  console.log("Downloading CAPTCHA images...\n");

  // Fetch all images into memory
  const buffers = await Promise.all(images.map(fetchImage));
  if (buffers.some((b) => b === null)) {
    console.log("\n⚠️  Failed to download CAPTCHA images. Please try again.\n");
    return;
  }

  // Create composite image
  const tileSize = 256;
  const canvas = pureimage.make(tileSize * 3, tileSize * 3);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, tileSize * 3, tileSize * 3);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const buffer = buffers[index]!;
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      const img = await pureimage.decodeJPEGFromStream(readable);
      ctx.drawImage(img, 0, 0, img.width, img.height, col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }

  // Apply overlay
  const overlayImage = await loadOverlay();
  ctx.drawImage(overlayImage, 0, 0, tileSize * 3, tileSize * 3);

  const compositePath = `${CAPTCHA_IMAGES_DIR}/captcha_composite.png`;
  const passThrough = new PassThrough();
  const chunks: Buffer[] = [];
  passThrough.on("data", (chunk) => chunks.push(chunk));
  await pureimage.encodePNGToStream(canvas, passThrough);
  passThrough.end();
  await writeFile(compositePath, Buffer.concat(chunks));

  console.log(`CAPTCHA image: ${compositePath}\n`);
  console.log("Open the image, select all squares containing a duck,");
  console.log("then run: search --solve <indices>\n");
  console.log("Example: search --solve 1 3 5 7\n");
}

export function parseCaptcha(html: string): {
  action: string;
  submitValue: string;
  images: string[];
  checkboxNames: string[];
  challenge: string;
} | null {
  const $ = cheerio.load(html);
  const challengeForm = $("#challenge-form");
  if (challengeForm.length === 0) return null;

  const action = challengeForm.attr("action") || "";
  const submitButton = challengeForm.find("button[name='challenge-submit']");
  const submitValue = submitButton.attr("value") || "";

  const images: string[] = [];
  const checkboxNames: string[] = [];
  challengeForm.find(".anomaly-modal__image").each((_, elem) => {
    const src = $(elem).attr("src") || "";
    images.push(new URL(src, "https://duckduckgo.com").href);
    const filename = src.split("/").pop()?.replace(".jpg", "") || "";
    if (filename) checkboxNames.push(`image-check_${filename}`);
  });

  const challenge = challengeForm.find(".anomaly-modal__instructions").text();
  return { action, submitValue, images, checkboxNames, challenge };
}

export async function solveCaptcha(indices: number[]): Promise<void> {
  const { loadState, clearState } = await import("./state");
  const state = await loadState();

  if (!state?.action || !state?.submitValue || !state?.checkboxNames) {
    console.error("No active CAPTCHA challenge. Run a search first.");
    return;
  }

  const formData = new URLSearchParams();
  formData.append("challenge-submit", state.submitValue);
  for (const index of indices) {
    if (index >= 1 && index <= state.checkboxNames.length) {
      formData.append(state.checkboxNames[index - 1]!, "1");
    }
  }

  const actionUrl = new URL(state.action, "https://duckduckgo.com");

  const response = await fetch(actionUrl, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://lite.duckduckgo.com/lite/",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    console.error(`Error solving CAPTCHA: ${response.status}`);
    return;
  }

  await clearState();
  const html = await response.text();
  const captchaResult = parseCaptcha(html);

  if (captchaResult) {
    // CAPTCHA still required
    const { doSearch } = await import("./search");
    await handleCaptcha(captchaResult.challenge, captchaResult.images);
    const newState: CaptchaState = {
      challenge: captchaResult.challenge,
      images: captchaResult.images,
      action: captchaResult.action,
      submitValue: captchaResult.submitValue,
      checkboxNames: captchaResult.checkboxNames,
      formData: null,
      query: state.query,
      region: state.region,
      dateFrame: state.dateFrame,
    };
    const { saveState } = await import("./state");
    await saveState(newState);
  } else {
    // CAPTCHA solved, re-run search
    const { doSearch } = await import("./search");
    if (state.query) {
      await doSearch(state.query, state.region ?? undefined, state.dateFrame ?? undefined);
    }
  }
}
