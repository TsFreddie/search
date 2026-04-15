import * as cheerio from "cheerio";
import { defaultHeaders, supportedRegions, supportedDateFrames } from "./types";
import type { CaptchaState } from "./types";
import { saveState, clearState } from "./state";
import { handleCaptcha, parseCaptcha } from "./captcha";

export interface SearchOptions {
  region?: string;
  dateFrame?: string;
}

export async function doSearch(
  query: string,
  region?: string,
  dateFrame?: string
): Promise<void> {
  await clearState();

  const searchParams = new URLSearchParams();
  searchParams.set("q", query);

  // Apply region filter
  const regionCode = region ? supportedRegions[region] : "";
  if (regionCode) {
    searchParams.set("kl", regionCode);
  }

  // Apply date frame filter
  const dateCode = dateFrame ? supportedDateFrames[dateFrame] : "";
  if (dateCode) {
    searchParams.set("df", dateCode);
  }

  // Use lite.duckduckgo.com/lite (POST request)
  const response = await fetch("https://lite.duckduckgo.com/lite/", {
    method: "POST",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: searchParams.toString(),
  });

  if (!response.ok) {
    console.error(`Search failed: ${response.status}`);
    return;
  }

  const html = await response.text();
  const captchaResult = parseCaptcha(html);

  if (captchaResult) {
    await handleCaptcha(captchaResult.challenge, captchaResult.images);
    const state: CaptchaState = {
      challenge: captchaResult.challenge,
      images: captchaResult.images,
      action: captchaResult.action,
      submitValue: captchaResult.submitValue,
      checkboxNames: captchaResult.checkboxNames,
      formData: null,
      query,
      region: region ?? null,
      dateFrame: dateFrame ?? null,
    };
    await saveState(state);
    return;
  }

  // Parse results from lite.duckduckgo.com
  const results = parseResults(html);

  // Display results
  let regionInfo = "";
  if (region && region !== "global") {
    regionInfo = ` (${region})`;
  }

  console.log(`\n🔍 Search results for: "${query}"${regionInfo}\n`);

  if (results.length === 0) {
    console.log("No results found.\n");
    return;
  }

  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.url}`);
    if (r.description) console.log(`   ${r.description.substring(0, 150)}...`);
    console.log();
  });

  // Pagination
  const paginationData = parsePagination(html);
  if (paginationData) {
    const state: CaptchaState = {
      challenge: null,
      images: null,
      action: null,
      submitValue: null,
      checkboxNames: null,
      formData: paginationData,
      query,
      region: region ?? null,
      dateFrame: dateFrame ?? null,
    };
    await saveState(state);
    console.log("More results available. Run 'search --next' for next page.\n");
  }
}

export async function doNext(): Promise<void> {
  const { loadState } = await import("./state");
  const state = await loadState();

  if (!state?.formData) {
    console.error("No next page available. Run a search first.");
    return;
  }

  // formData contains POST data for lite pagination
  const response = await fetch("https://lite.duckduckgo.com/lite/", {
    method: "POST",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: state.formData,
  });

  if (!response.ok) {
    console.error(`Failed to get next page: ${response.status}`);
    return;
  }

  const html = await response.text();
  const captchaResult = parseCaptcha(html);

  if (captchaResult) {
    await handleCaptcha(captchaResult.challenge, captchaResult.images);
    const newState: CaptchaState = {
      challenge: captchaResult.challenge,
      images: captchaResult.images,
      action: captchaResult.action,
      submitValue: captchaResult.submitValue,
      checkboxNames: captchaResult.checkboxNames,
      formData: state.formData,
      query: state.query,
      region: state.region,
      dateFrame: state.dateFrame,
    };
    await saveState(newState);
    return;
  }

  // Parse results
  const results = parseResults(html);

  console.log("\n📄 Next page results\n");

  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.url}`);
    if (r.description) console.log(`   ${r.description.substring(0, 150)}...`);
    console.log();
  });

  // Pagination
  const paginationData = parsePagination(html);
  if (paginationData) {
    const newState: CaptchaState = {
      ...state,
      formData: paginationData,
    };
    await saveState(newState);
    console.log("More results available. Run 'search --next' for next page.\n");
  } else {
    // No more pages, clear state
    const { clearState } = await import("./state");
    await clearState();
  }
}

function parseResults(html: string): { title: string; url: string; description: string }[] {
  const $ = cheerio.load(html);
  const results: { title: string; url: string; description: string }[] = [];

  $("a.result-link").each((_, elem) => {
    const url = $(elem).attr("href") || "";
    const title = $(elem).text().trim();

    // Get the snippet from the next sibling row
    const parent = $(elem).parent().parent();
    let description = "";
    const snippetTd = parent.next().find("td.result-snippet");
    if (snippetTd.length > 0) {
      description = snippetTd.text().trim();
    }

    if (title && !url.includes("duckduckgo.com")) {
      results.push({ title, url, description });
    }
  });

  return results;
}

function parsePagination(html: string): string | null {
  const $ = cheerio.load(html);
  const nextForm = $("form.next_form");

  if (nextForm.length === 0) return null;

  const formData = new URLSearchParams();
  nextForm.find("input").each((_, input) => {
    const name = $(input).attr("name");
    const value = $(input).attr("value") || "";
    if (name) formData.append(name, value);
  });

  return formData.toString();
}
