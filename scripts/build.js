const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Starting build process...\n');

try {
  // Use npx to find nest CLI in node_modules/.bin
  execSync('npx nest build', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('\n✅ Build completed successfully!\n');
  process.exit(0);
} catch (error) {
  console.log('\n❌ Build failed!\n');
  process.exit(1);
}

