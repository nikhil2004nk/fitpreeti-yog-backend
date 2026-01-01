const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Starting build process...\n');

const projectRoot = path.resolve(__dirname, '..');
const nestCliPath = path.join(projectRoot, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

try {
  // Check if nest CLI exists
  if (fs.existsSync(nestCliPath)) {
    // Use node to execute the nest.js file directly (bypasses permission issues with binary)
    console.log('Using NestJS CLI...');
    execSync(`node "${nestCliPath}" build`, { 
      stdio: 'inherit',
      cwd: projectRoot
    });
  } else {
    // Fallback: try using npx
    console.log('NestJS CLI not found, trying npx...');
    execSync('npx --yes @nestjs/cli build', { 
      stdio: 'inherit',
      cwd: projectRoot
    });
  }
  console.log('\n✅ Build completed successfully!\n');
  process.exit(0);
} catch (error) {
  console.log('\n❌ Build failed!\n');
  if (error.message) {
    console.error('Error:', error.message);
  }
  process.exit(1);
}

