// Development build script
const { build } = require('vite')
const { execSync } = require('child_process')
const path = require('path')

async function buildProject() {
  console.log('🏗️  Building Ravenswatch Game Coach...')
  
  try {
    // Build renderer (React app)
    console.log('📦 Building renderer process...')
    await build({
      configFile: path.resolve(__dirname, '../vite.config.ts'),
      mode: 'production'
    })
    
    // Build main process (Electron)
    console.log('🔧 Building main process...')
    execSync('tsc -p tsconfig.main.json', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    })
    
    console.log('✅ Build completed successfully!')
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  buildProject()
}

module.exports = { buildProject }
