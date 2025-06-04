// Development server script
const { spawn } = require('child_process')
const path = require('path')

function startDev() {
  console.log('🚀 Starting Ravenswatch Game Coach development server...')
  
  // Start Vite dev server for renderer
  console.log('📦 Starting renderer dev server...')
  const viteProcess = spawn('npm', ['run', 'dev:vite'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname, '..')
  })
  
  // Wait a bit then start Electron
  setTimeout(() => {
    console.log('⚡ Starting Electron...')
    const electronProcess = spawn('npm', ['run', 'dev:electron'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..')
    })
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...')
      viteProcess.kill()
      electronProcess.kill()
      process.exit(0)
    })
    
  }, 3000) // Wait 3 seconds for Vite to start
}

if (require.main === module) {
  startDev()
}

module.exports = { startDev }
