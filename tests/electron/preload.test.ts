import { ipcRenderer, contextBridge } from 'electron'
import { strict as assert } from 'assert'
import { after, describe, it } from 'mocha'

// Capture calls to ipcRenderer.invoke
const calls: Array<{ channel: string; args: any[] }> = []
const originalInvoke = ipcRenderer.invoke
ipcRenderer.invoke = async (channel: string, ...args: any[]) => {
  calls.push({ channel, args })
  return 'ok'
}

// Stub exposeInMainWorld to capture API
const originalExpose = contextBridge.exposeInMainWorld
contextBridge.exposeInMainWorld = (name: string, api: any) => {
  ;(window as any)[name] = api
}

// Load the preload script which exposes the API
import '../../src/preload/preload'

describe('preload IPC exposure', () => {
  after(() => {
    ipcRenderer.invoke = originalInvoke
    contextBridge.exposeInMainWorld = originalExpose
  })

  it('exposes electronAPI on window', () => {
    assert.ok((window as any).electronAPI)
  })

  it('getAppVersion invokes correct IPC channel', async () => {
    await (window as any).electronAPI.getAppVersion()
    const called = calls.find(c => c.channel === 'get-app-version')
    assert.ok(called, 'get-app-version channel was not invoked')
  })
})
