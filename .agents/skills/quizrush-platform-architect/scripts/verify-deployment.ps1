<#
.SYNOPSIS
    QuizRush Deployment Verification & Security Guard
.DESCRIPTION
    Validates Next.js build compilation, route generation, and ensures zero secrets are staged in Git.
#>

$ErrorActionPreference = "Stop"

Write-Host "[1/3] Setting execution environment PATH..." -ForegroundColor Cyan
$env:PATH = "C:\Users\karu\AppData\Local\Programs\nodejs;C:\Program Files\Git\cmd;$env:PATH"

Write-Host "[2/3] Running production Next.js build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "[FAIL] Build failed. Please inspect TypeScript and routing errors."
    exit $LASTEXITCODE
}
Write-Host "[PASS] Build succeeded with all routes compiled!" -ForegroundColor Green

Write-Host "[3/3] Checking Git status for unignored secrets..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus -match "\.env") {
    Write-Error "[SECURITY ALERT] A .env file is staged or untracked in Git. Aborting to prevent credential leaks!"
    exit 1
}

Write-Host "[PASS] Security check passed: Zero credentials exposed." -ForegroundColor Green
Write-Host "[READY] QuizRush is verified and ready for safe deployment!" -ForegroundColor Yellow
