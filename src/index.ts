import { supportedRegions, supportedDateFrames } from "./types";
import { doSearch, doNext } from "./search";
import { solveCaptcha } from "./captcha";

function printHelp() {
  console.log(`Usage: search [options] <query>
       search --solve <indices>
       search --next

Options:
  -h, --help         Show this help message
  --region <name>    Search region (default: global)
  --date <frame>     Date frame: any, past_day, past_week, past_month, past_year

Regions: ${Object.keys(supportedRegions).join(", ")}
Dates: ${Object.keys(supportedDateFrames).join(", ")}

Examples:
  search typescript tutorial
  search --region japan react hooks
  search --date past_week javascript news
  search --region us_english --date past_month rust
  search --solve 1 3 5 7`);
}

function isUnrecognizedOption(arg: string): boolean {
  return arg.startsWith("-") && !["-h", "--help", "--region", "--date", "--solve", "--next"].some((opt) => arg === opt || arg.startsWith(`${opt}=`));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    process.exit(0);
  }

  if (args[0] === "--solve") {
    const indices = args.slice(1).map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 9);
    if (indices.length === 0) {
      console.error("Please provide indices (1-9).");
      process.exit(1);
    }
    await solveCaptcha(indices);
    return;
  }

  if (args[0] === "--next") {
    await doNext();
    return;
  }

  // Parse options
  let region: string | undefined;
  let dateFrame: string | undefined;
  const positional: string[] = [];
  let unrecognizedOption: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (isUnrecognizedOption(arg)) {
      unrecognizedOption = arg;
      break;
    }
    if (arg === "--region" && i + 1 < args.length) {
      region = args[++i]!;
    } else if (arg === "--date" && i + 1 < args.length) {
      dateFrame = args[++i]!;
    } else {
      positional.push(arg);
    }
  }

  if (unrecognizedOption) {
    console.error(`error: unrecognized option '${unrecognizedOption}'`);
    console.error("Try 'search --help' for more information.");
    process.exit(1);
  }

  const query = positional.join(" ");
  if (!query) {
    console.error("Please provide a search query.");
    process.exit(1);
  }

  await doSearch(query, region, dateFrame);
}

main();
