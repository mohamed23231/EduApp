# Custom Font Assets — Geist & Rubik

This directory must contain the following font files before the app can be built
with custom typography. Without these files the app falls back to **Inter**
(loaded via `@expo-google-fonts/inter` and the `expo-font` plugin).

## Required Files

| File Name               | Family        | Weight   | Script  | Source                              |
|-------------------------|---------------|----------|---------|-------------------------------------|
| `GeistVariable.ttf`     | Geist         | Variable | Latin   | https://github.com/vercel/geist-font |
| `Geist-Bold.ttf`        | Geist         | 700      | Latin   | https://github.com/vercel/geist-font |
| `Rubik-Regular.ttf`     | Rubik         | 400      | Arabic  | Google Fonts                         |
| `Rubik-Medium.ttf`      | Rubik         | 500      | Arabic  | Google Fonts                         |
| `Rubik-Bold.ttf`        | Rubik         | 700      | Arabic  | Google Fonts                         |

## Download Instructions

### Geist (Latin)

1. Go to <https://github.com/vercel/geist-font/releases>
2. Download the latest release archive
3. Extract `GeistVariable.ttf` and `Geist-Bold.ttf` into this directory

### Rubik (Arabic)

1. Go to <https://fonts.google.com/specimen/Rubik>
2. Click **Download family**
3. From the downloaded ZIP, extract:
   - `Rubik-Regular.ttf`
   - `Rubik-Medium.ttf`
   - `Rubik-Bold.ttf`
4. Place all three files in this directory

## After Adding Fonts

1. The `expo-font` plugin in `app.config.ts` will detect the files via
   `existsSync` and link them natively on iOS and Android.
2. Update `src/lib/load-custom-fonts.ts` — set `CUSTOM_FONTS_AVAILABLE` to
   `true` and uncomment the `Font.loadAsync` call to enable JS-side loading
   for web builds.
3. Restart Metro bundler (`pnpm start --clear`).

## License

- **Geist**: SIL Open Font License 1.1 — see the Geist GitHub repository.
- **Rubik**: SIL Open Font License 1.1 — see Google Fonts.
