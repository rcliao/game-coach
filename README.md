# Ravenswatch Game Coach

AI-powered overlay coach for Ravenswatch. The app captures your gameplay, sends frames to Google Gemini, and displays tactical suggestions while you play.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure your Gemini API key**
   - Open **Settings** and paste your API key under **Gemini Key**.
3. **Set a system instruction**
   - Choose or type the coaching style you want Gemini to follow.
4. **Select a capture source**
   - Pick the monitor or window you want the app to analyze.
5. **Start the session**
   - Press **Start** to begin capturing and watch the overlay for advice.

## Windows Support

The coach currently runs on **Windows only**. Mac support is planned for a future release.

## Project Structure

```
root
├── assets/                  # Game templates and instruction presets
├── docs/
│   ├── archive/             # Historical plans
│   └── requirements/        # Product requirements
├── scripts/                 # Build helpers
├── src/
│   ├── main/                # Electron main process
│   ├── preload/             # IPC bridge
│   ├── renderer/            # React UI
│   └── shared/              # Shared types and constants
├── tests/                   # Unit and integration tests
└── package.json
```

## Development Commands

```bash
npm run dev        # Start development mode
npm run build      # Production build
npm run lint       # Lint source
npm run type-check # TypeScript type check
npm test           # Unit tests
npm run test:e2e   # Playwright tests
```

## License

MIT
