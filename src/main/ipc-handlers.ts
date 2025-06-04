import { ipcMain } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import { app } from 'electron'
import { screenCaptureService } from './screen-capture'

export function setupIPCHandlers() {
  // App configuration handlers
  ipcMain.handle('get-app-version', () => {
    return process.env.npm_package_version || '0.1.0'
  })

  // Settings handlers with file persistence
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      const userDataPath = app.getPath('userData')
      const settingsPath = path.join(userDataPath, 'settings.json')
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2))
      console.log('Settings saved successfully')
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      return false
    }
  })

  ipcMain.handle('load-settings', async () => {
    try {
      const userDataPath = app.getPath('userData')
      const settingsPath = path.join(userDataPath, 'settings.json')
      
      const data = await fs.readFile(settingsPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      // Return default settings if file doesn't exist
      return {
        llmProvider: 'openai',
        openaiApiKey: '',
        geminiApiKey: '',
        overlayEnabled: true,
        ttsEnabled: false,
        captureInterval: 5000,
        maxRetries: 3,
        timeout: 30000,
      }
    }
  })  // Enhanced screen capture handlers
  ipcMain.handle('get-capture-sources', async () => {
    try {
      console.log('IPC Handler: get-capture-sources called')
      const sources = await screenCaptureService.getAvailableSources()
      console.log('IPC Handler: Retrieved', sources.length, 'sources')
      return sources
    } catch (error) {
      console.error('Failed to get capture sources:', error)
      return []
    }
  })

  ipcMain.handle('start-screen-capture', async (event, sourceId) => {
    try {
      console.log('Starting screen capture for source:', sourceId)
      await screenCaptureService.startCapture(sourceId)
      return true
    } catch (error) {
      console.error('Failed to start screen capture:', error)
      return false
    }
  })

  ipcMain.handle('stop-screen-capture', async () => {
    try {
      console.log('Stopping screen capture')
      await screenCaptureService.stopCapture()
      return true
    } catch (error) {
      console.error('Failed to stop screen capture:', error)
      return false
    }
  })
  ipcMain.handle('capture-frame', async () => {
    try {
      // For now, this is just a placeholder that coordinates with renderer
      // The actual frame capture happens in the renderer process
      console.log('Frame capture requested - renderer should handle actual capture')
      return null
    } catch (error) {
      console.error('Failed to capture frame:', error)
      return null
    }
  })

  // LLM analysis handlers
  ipcMain.handle('analyze-frame', async (event, frameData, analysisRequest) => {
    console.log('Frame analysis requested:', analysisRequest)
    // The actual analysis will be done in the renderer process
    // This handler can be used for logging or coordination
    return true
  })

  // Game template handlers
  ipcMain.handle('load-game-template', async (event, gameName) => {
    try {
      const templatePath = path.join(__dirname, '..', '..', 'assets', 'game-templates', gameName)
      
      // Load HUD regions
      const hudRegionsPath = path.join(templatePath, 'hud-regions.json')
      const hudRegions = JSON.parse(await fs.readFile(hudRegionsPath, 'utf-8'))
      
      // Load prompts
      const promptsPath = path.join(templatePath, 'prompts.json')
      const prompts = JSON.parse(await fs.readFile(promptsPath, 'utf-8'))
      
      return { hudRegions, prompts }
    } catch (error) {
      console.error('Failed to load game template:', error)
      return null
    }  })

  console.log('IPC handlers setup complete')
}
