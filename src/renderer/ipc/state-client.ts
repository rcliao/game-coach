export interface StateClient {
  stateGetCurrent(): Promise<any>
  onStateUpdated(callback: (state: any) => void): () => void
  stateUpdateBulk(updates: any): Promise<any>
  stateSetGameState(gameState: any): Promise<any>
  stateSetAnalyzing(analyzing: boolean): Promise<any>
  stateSetLastAnalysis(analysis: any): Promise<any>
  stateSetSettings(settings: any): Promise<any>
  stateSetOverlayVisible(visible: boolean): Promise<any>
  showOverlay(): Promise<void>
  hideOverlay(): Promise<void>
}

export class ElectronStateClient implements StateClient {
  stateGetCurrent() {
    return window.electronAPI.stateGetCurrent()
  }
  onStateUpdated(callback: (state: any) => void) {
    return window.electronAPI.onStateUpdated(callback)
  }
  stateUpdateBulk(updates: any) {
    return window.electronAPI.stateUpdateBulk(updates)
  }
  stateSetGameState(gameState: any) {
    return window.electronAPI.stateSetGameState(gameState)
  }
  stateSetAnalyzing(analyzing: boolean) {
    return window.electronAPI.stateSetAnalyzing(analyzing)
  }
  stateSetLastAnalysis(analysis: any) {
    return window.electronAPI.stateSetLastAnalysis(analysis)
  }
  stateSetSettings(settings: any) {
    return window.electronAPI.stateSetSettings(settings)
  }
  stateSetOverlayVisible(visible: boolean) {
    return window.electronAPI.stateSetOverlayVisible(visible)
  }
  showOverlay() {
    return window.electronAPI.showOverlay()
  }
  hideOverlay() {
    return window.electronAPI.hideOverlay()
  }
}
