# search

A CLI tool to search the web using DuckDuckGo Lite.

## Install

```bash
npm install -g @tsfreddie/search
```

## Usage

```bash
search "your query"
```

### Options

- `--region <name>` - Search region (default: global)
- `--date <frame>` - Date frame: `any`, `past_day`, `past_week`, `past_month`, `past_year`
- `--next` - Get next page of results

### Examples

```bash
# Basic search
search "typescript tutorial"

# Search in specific region
search --region japan "sushi"

# Search within past week
search --date past_week "AI news"

# Navigate to next page
search --next
```

### CAPTCHA

If a CAPTCHA is required, the tool will present a challenge and save a captcha image. To solve the CAPTCHA, use:

```bash
search --solve 1 3 5
```

## Build

```bash
npm install
npm run build
```

## License

MIT
