$ErrorActionPreference = 'Stop'

$workspace = 'C:\Users\ASUS\Documents\Playground'
$backendDir = Join-Path $workspace 'campus-match-backend'
$frontendDir = Join-Path $workspace 'campus-match-frontend'
$adminDir = Join-Path $workspace 'campus-match-admin'

function Test-RequiredPath {
  param(
    [string]$Path,
    [string]$Name
  )

  if (-not (Test-Path $Path)) {
    throw "$Name path not found: $Path"
  }
}

function Start-ServiceWindow {
  param(
    [string]$Title,
    [string]$WorkingDirectory,
    [string]$Command
  )

  $escaped = $Command.Replace('"', '\"')
  Start-Process powershell.exe -ArgumentList @(
    '-NoExit',
    '-Command',
    "`$Host.UI.RawUI.WindowTitle = '$Title'; Set-Location '$WorkingDirectory'; $escaped"
  ) | Out-Null
}

Test-RequiredPath -Path $backendDir -Name 'Backend'
Test-RequiredPath -Path $frontendDir -Name 'Frontend'
Test-RequiredPath -Path $adminDir -Name 'Admin'

Write-Host 'Starting MySQL container...' -ForegroundColor Cyan
try {
  & docker compose -f docker-compose.mysql.yml up -d | Out-Host
} catch {
  Write-Warning 'MySQL container did not start. If Docker Desktop is not running, start it first and rerun this script.'
}

Start-Sleep -Seconds 2

Write-Host 'Opening backend window...' -ForegroundColor Cyan
Start-ServiceWindow `
  -Title 'Campus Match Backend' `
  -WorkingDirectory $backendDir `
  -Command 'npm run start:dev'

Write-Host 'Opening frontend window...' -ForegroundColor Cyan
Start-ServiceWindow `
  -Title 'Campus Match Frontend' `
  -WorkingDirectory $frontendDir `
  -Command 'npm run dev:h5'

Write-Host 'Opening admin window...' -ForegroundColor Cyan
Start-ServiceWindow `
  -Title 'Campus Match Admin' `
  -WorkingDirectory $adminDir `
  -Command 'npm run dev'

Write-Host ''
Write-Host 'Services are starting in separate windows.' -ForegroundColor Green
Write-Host 'Backend health: http://localhost:3000/api/v1/health'
Write-Host 'Admin panel:    http://localhost:5174'
Write-Host 'User frontend:  check the frontend window for the actual H5 URL'
