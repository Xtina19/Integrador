$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

Write-Host "Root: $root"

# 1) Backend: backend/backend -> Backend
$innerBackend = Join-Path $root 'backend\backend'
$backendTarget = Join-Path $root 'Backend'
$backendTemp = Join-Path $root '_backend_temp'

if (Test-Path $innerBackend) {
  if (Test-Path $backendTarget) { Remove-Item $backendTarget -Recurse -Force }
  Move-Item $innerBackend $backendTemp
  $outerBackend = Join-Path $root 'backend'
  if (Test-Path $outerBackend) { Remove-Item $outerBackend -Recurse -Force }
  Move-Item $backendTemp $backendTarget
  Write-Host 'Backend moved to Backend/'
}

# 2) Frontend folder
$frontendTarget = Join-Path $root 'Frontend'
if (-not (Test-Path $frontendTarget)) {
  New-Item -ItemType Directory -Path $frontendTarget | Out-Null
}

$frontendItems = @(
  'src', 'public', 'node_modules', 'dist', 'scripts',
  'index.html', 'package.json', 'package-lock.json',
  'vite.config.ts', 'tsconfig.json', 'tsconfig.node.json',
  'tsconfig.tsbuildinfo', 'postcss.config.js', 'tailwind.config.js',
  '.env.example', '.env'
)

foreach ($item in $frontendItems) {
  $source = Join-Path $root $item
  if (Test-Path $source) {
    $dest = Join-Path $frontendTarget $item
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Move-Item $source $dest
    Write-Host "Moved $item -> Frontend/"
  }
}

Write-Host 'Monorepo reorganization complete.'
