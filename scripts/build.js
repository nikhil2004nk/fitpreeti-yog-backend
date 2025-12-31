const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Starting build process...\n');

try {
  execSync('nest build', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('\n✅ Build completed successfully!\n');
  process.exit(0);
} catch (error) {
  console.log('\n❌ Build failed!\n');
  process.exit(1);
}

