# Gaming Coach Development Plan - Ravenswatch Edition

## Project Overview
A real-time AI gaming coach for Ravenswatch that captures gameplay, analyzes it using LLMs (ChatGPT/Gemini), and provides instant tactical advice through overlay and/or voice.

**Target Game:** Ravenswatch (single-player focus)  
**Architecture:** Monolithic Electron app (initially)  
**Timeline:** 8 weeks to MVP  

## Technology Stack

### Core Technologies
- **Frontend:** React + TypeScript
- **Desktop Framework:** Electron
- **Screen Capture:** Electron's desktopCapturer API
- **Image Processing:** Canvas API + Sharp (Node.js)
- **LLM APIs:** OpenAI GPT-4 Vision + Google Gemini Vision
- **TTS:** Integrated LLM TTS (OpenAI TTS / Gemini Audio) + ElevenLabs fallback
- **State Management:** Zustand or Redux Toolkit
- **Build Tool:** Vite
- **Package Manager:** npm

### Key Libraries
```json
{
  "electron": "^28.0.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "electron-builder": "^24.0.0",
  "sharp": "^0.33.0",
  "openai": "^4.0.0",
  "@google/generative-ai": "^0.2.0",
  "zustand": "^4.4.0",
  "tailwindcss": "^3.3.0"
}
```

## Project Structure

```
game-coach/
├── docs/
│   ├── requirements/
│   │   └── v0.md
│   └── plans/
│       └── development-plan.md
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Entry point
│   │   ├── screen-capture.ts   # Screen recording logic
│   │   ├── image-processor.ts  # Frame processing & compression
│   │   └── ipc-handlers.ts     # IPC communication
│   ├── renderer/               # React frontend
│   │   ├── components/
│   │   │   ├── ConfigPanel.tsx
│   │   │   ├── GameOverlay.tsx
│   │   │   ├── AdviceDisplay.tsx
│   │   │   └── SettingsModal.tsx
│   │   ├── services/
│   │   │   ├── llm-service.ts  # LLM API abstraction
│   │   │   ├── tts-service.ts  # Text-to-speech
│   │   │   └── game-detector.ts # Ravenswatch detection
│   │   ├── stores/
│   │   │   └── app-store.ts    # Global state
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript definitions
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── shared/                 # Shared types & utilities
│   │   ├── types.ts
│   │   └── constants.ts
│   └── preload/
│       └── preload.ts          # Secure IPC bridge
├── assets/
│   ├── icons/
│   └── game-templates/
│       └── ravenswatch/
│           ├── hud-regions.json
│           └── prompts.json
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
│   ├── build.js
│   └── dev.js
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.config.js
└── README.md
```

## Development Phases

### Phase 1: Foundation Setup (Week 1)
**Goal:** Basic Electron app with screen capture

#### Tasks:
1. **Project Setup**
   - Initialize Electron + React + TypeScript project
   - Configure Vite for Electron
   - Set up development scripts and hot reload
   - Configure TypeScript paths and build pipeline

2. **Screen Capture Foundation**
   - Implement screen source selection UI
   - Basic screen capture using desktopCapturer
   - Frame rate control (30fps target)
   - Basic image compression (JPEG, 720p)

3. **Core UI Components**
   - Main control panel window
   - Settings modal for API keys
   - Basic overlay window (transparent, always-on-top)

#### Deliverables:
- Working Electron app that can capture screen
- Basic UI for configuration
- Frame capture at 720p/30fps

### Phase 2: LLM Integration (Week 2)
**Goal:** Connect to LLM APIs and get basic advice

#### Tasks:
1. **LLM Service Layer**
   - OpenAI GPT-4 Vision API integration
   - Google Gemini Vision API integration
   - Unified interface for both providers
   - Error handling and retry logic

2. **Image Processing Pipeline**
   - Frame preprocessing (crop, resize, enhance)
   - JPEG optimization for API transmission
   - Rate limiting (5-second intervals)
   - Frame differential analysis (future optimization)

3. **Ravenswatch Game Detection**
   - Window title detection
   - Process name matching
   - Basic HUD element recognition

#### Deliverables:
- Console output showing LLM responses to gameplay frames
- Configurable LLM provider switching
- Basic Ravenswatch game detection

### Phase 3: Advice System (Week 3)
**Goal:** Parse LLM responses and display advice

#### Tasks:
1. **Prompt Engineering**
   - Ravenswatch-specific prompts
   - JSON response format specification
   - Context-aware advice categories (combat, exploration, items)
   - Confidence scoring system

2. **Advice Processing**
   - JSON response parsing
   - Advice categorization and prioritization
   - Duplicate advice filtering
   - Confidence threshold implementation

3. **Basic Overlay Display**
   - Simple text overlay for advice
   - Positioning and styling
   - Auto-hide timers
   - Multiple advice queue management

#### Deliverables:
- Structured advice output from LLM
- Basic overlay showing parsed advice
- Ravenswatch-specific prompt templates

### Phase 4: TTS Integration (Week 4)
**Goal:** Add voice output for advice

#### Tasks:
1. **TTS Service Implementation**
   - OpenAI TTS API integration
   - Gemini Audio API integration
   - ElevenLabs backup integration
   - Audio queue management

2. **Audio Settings**
   - Voice selection and customization
   - Volume and speed controls
   - Audio device selection
   - Mute/unmute functionality

3. **Overlay Improvements**
   - Visual feedback for audio advice
   - Synchronized text/audio display
   - Better styling and animations

#### Deliverables:
- Working TTS for advice output
- Audio configuration options
- Improved overlay UI

### Phase 5: Optimization & Polish (Week 5-6)
**Goal:** Performance optimization and user experience

#### Tasks:
1. **Performance Optimization**
   - Frame capture optimization
   - Memory usage reduction
   - CPU usage monitoring (<10% target)
   - API call batching and caching

2. **Advanced Features**
   - HUD region detection for Ravenswatch
   - Context-aware advice (health, mana, inventory)
   - Advice history and replay
   - Settings persistence

3. **Error Handling & Monitoring**
   - Comprehensive error handling
   - Performance telemetry
   - API usage tracking
   - Graceful degradation

#### Deliverables:
- Optimized performance (sub-150ms latency goal)
- Advanced Ravenswatch-specific features
- Robust error handling

### Phase 6: Testing & Beta (Week 7)
**Goal:** Internal testing and refinement

#### Tasks:
1. **Testing Framework**
   - Unit tests for core services
   - Integration tests for LLM APIs
   - Performance benchmarking
   - Manual testing scenarios

2. **User Experience Testing**
   - Advice accuracy validation
   - Latency measurement
   - Usability testing
   - Anti-cheat compatibility verification

3. **Documentation**
   - User manual
   - API documentation
   - Troubleshooting guide
   - Setup instructions

#### Deliverables:
- Comprehensive test suite
- Performance benchmarks
- User documentation

### Phase 7: Release Preparation (Week 8)
**Goal:** Packaging and distribution

#### Tasks:
1. **Build & Packaging**
   - Electron Builder configuration
   - Windows installer creation
   - Code signing setup
   - Auto-updater implementation

2. **Release Process**
   - GitHub Actions CI/CD
   - Release automation
   - Version management
   - Distribution testing

3. **Final Polish**
   - Bug fixes from testing
   - Performance final optimization
   - UI/UX improvements
   - Security audit

#### Deliverables:
- Packaged Windows installer
- GitHub release pipeline
- Production-ready application

## Key Technical Decisions

### Screen Capture Strategy
- **Choice:** Electron's desktopCapturer API
- **Rationale:** Built-in, cross-platform, no additional dependencies
- **Implementation:** User selects screen/window, capture at 720p/30fps

### LLM Integration Approach
- **Choice:** Dual provider support (OpenAI + Gemini)
- **Rationale:** Performance comparison, redundancy, cost optimization
- **Implementation:** Unified service interface with provider switching

### TTS Strategy
- **Choice:** Integrated LLM TTS as primary, ElevenLabs as fallback
- **Rationale:** Reduced latency, consistent API, cost efficiency
- **Implementation:** Service abstraction with automatic fallback

### State Management
- **Choice:** Zustand for simplicity
- **Rationale:** Lightweight, TypeScript-friendly, good for this scale
- **Implementation:** Centralized store for app state, settings, advice history

## Risk Mitigation Strategies

### Latency Management
- **Target:** <150ms end-to-end
- **Strategies:**
  - Frame preprocessing optimization
  - API response streaming
  - Local caching of common responses
  - Delta frame analysis for reduced data

### API Cost Control
- **Strategies:**
  - Frame rate throttling
  - Smart region cropping
  - Response caching
  - Usage monitoring and alerts

### Anti-Cheat Compatibility
- **Approach:**
  - Use standard Windows APIs only
  - No game memory injection
  - External overlay approach
  - Spectator mode when available

### Performance Optimization
- **Targets:**
  - <10% CPU increase
  - <200MB memory usage
  - Minimal GPU impact
- **Strategies:**
  - Efficient image processing
  - Worker threads for heavy tasks
  - Memory pooling
  - Profiling and monitoring

## Success Metrics Tracking

### Technical Metrics
- **Latency:** P90 response time measurement
- **Accuracy:** Manual validation of advice quality
- **Performance:** CPU/GPU/Memory usage monitoring
- **Reliability:** Error rate and uptime tracking

### User Experience Metrics
- **Engagement:** Advice interactions per minute
- **Adoption:** Session duration and frequency
- **Satisfaction:** Manual feedback collection
- **Usability:** Task completion rates

## Development Environment Setup

### Prerequisites
- Node.js 18+
- Git
- Visual Studio Code
- Ravenswatch game installed

### Initial Setup Commands
```powershell
# Clone and setup
git clone <repository>
cd game-coach
npm install

# Development
npm run dev

# Build
npm run build
npm run dist
```

## Next Steps

1. **Week 1 Start:** Project initialization and basic screen capture
2. **Daily Progress:** Commit working features incrementally
3. **Weekly Reviews:** Assess progress against milestones
4. **Continuous Testing:** Test with actual Ravenswatch gameplay
5. **Documentation:** Keep README and docs updated throughout

This plan prioritizes getting a working end-to-end prototype as quickly as possible, allowing for early validation and iteration based on real gameplay testing.
