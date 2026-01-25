# PowerShell script to upload files to server
# Usage: .\upload-to-server.ps1

$SERVER = "fitpreeti@srv1279934.hosted-by-vdsina.ru"
$REMOTE_PATH = "~/fitpreeti/fitpreeti-yog-backend"

Write-Host "🚀 Uploading files to server..." -ForegroundColor Green
Write-Host "Server: $SERVER" -ForegroundColor Cyan
Write-Host "Remote Path: $REMOTE_PATH" -ForegroundColor Cyan
Write-Host ""

# Files to upload (excluding node_modules, dist, .git, etc.)
$filesToUpload = @(
    "Dockerfile",
    "docker-compose.yml",
    ".dockerignore",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "nest-cli.json",
    "api",
    "src",
    "test"
)

Write-Host "📦 Uploading files..." -ForegroundColor Yellow

foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        Write-Host "  ✓ Uploading: $file" -ForegroundColor Gray
        scp -r $file "${SERVER}:${REMOTE_PATH}/"
    } else {
        Write-Host "  ✗ Not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps on server:" -ForegroundColor Yellow
Write-Host "  cd ~/fitpreeti/fitpreeti-yog-backend"
Write-Host "  docker compose stop backend"
Write-Host "  docker compose build --no-cache backend"
Write-Host "  docker compose up -d backend"
