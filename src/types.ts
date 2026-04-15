export const CAPTCHA_IMAGES_DIR = "/tmp/search-captcha";
export const STATE_FILE = `${CAPTCHA_IMAGES_DIR}/captcha_state.json`;

export interface CaptchaState {
  challenge: string | null;
  images: string[] | null;
  action: string | null;
  submitValue: string | null;
  checkboxNames: string[] | null;
  formData: string | null;
  query: string | null;
  region: string | null;
  dateFrame: string | null;
}

export const supportedRegions: Record<string, string> = {
  global: "",
  argentina: "ar-es",
  australia: "au-en",
  austria: "at-de",
  belgium_fr: "be-fr",
  belgium_nl: "be-nl",
  brazil: "br-pt",
  bulgaria: "bg-bg",
  canada_en: "ca-en",
  canada_fr: "ca-fr",
  catalonia: "ct-ca",
  chile: "cl-es",
  china: "cn-zh",
  colombia: "co-es",
  croatia: "hr-hr",
  czech_republic: "cz-cs",
  denmark: "dk-da",
  estonia: "ee-et",
  finland: "fi-fi",
  france: "fr-fr",
  germany: "de-de",
  greece: "gr-el",
  hong_kong: "hk-tzh",
  hungary: "hu-hu",
  iceland: "is-is",
  india_en: "in-en",
  indonesia_en: "id-en",
  ireland: "ie-en",
  israel_en: "il-en",
  italy: "it-it",
  japan: "jp-jp",
  korea: "kr-kr",
  latvia: "lv-lv",
  lithuania: "lt-lt",
  malaysia_en: "my-en",
  mexico: "mx-es",
  netherlands: "nl-nl",
  new_zealand: "nz-en",
  norway: "no-no",
  pakistan_en: "pk-en",
  peru: "pe-es",
  philippines_en: "ph-en",
  poland: "pl-pl",
  portugal: "pt-pt",
  romania: "ro-ro",
  russia: "ru-ru",
  saudi_arabia: "xa-ar",
  singapore: "sg-en",
  slovakia: "sk-sk",
  slovenia: "sl-sl",
  south_africa: "za-en",
  spain_ca: "es-ca",
  spain_es: "es-es",
  sweden: "se-sv",
  switzerland_de: "ch-de",
  switzerland_fr: "ch-fr",
  taiwan: "tw-tzh",
  thailand_en: "th-en",
  turkey: "tr-tr",
  us_english: "us-en",
  us_spanish: "us-es",
  ukraine: "ua-uk",
  united_kingdom: "uk-en",
  vietnam_en: "vn-en",
};

export const supportedDateFrames: Record<string, string> = {
  any: "",
  past_day: "d",
  past_week: "w",
  past_month: "m",
  past_year: "y",
};

export const defaultHeaders = {
  "User-Agent":
    "tsfreddie/search-tool (https://github.com/tsfreddie/search-tool)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://lite.duckduckgo.com/lite/",
  DNT: "1",
  "Sec-GPC": "1",
};
