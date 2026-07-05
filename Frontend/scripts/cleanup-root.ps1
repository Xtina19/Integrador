# Ejecutar desde la raíz del repo (detenga Vite/Node antes).
# PowerShell: .\scripts\cleanup-root.ps1

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root

if (Test-Path "node_modules") {
  Write-Host "Eliminando node_modules en la raiz..."
  Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
  if (Test-Path "node_modules") {
    Write-Warning "No se pudo eliminar node_modules. Cierre procesos de Vite/Node e intente de nuevo."
  } else {
    Write-Host "node_modules de la raiz eliminado."
  }
} else {
  Write-Host "No hay node_modules en la raiz."
}

if ((Test-Path (Join-Path $root "Frontend")) -and -not (Test-Path (Join-Path $root "frontend"))) {
  Rename-Item "Frontend" "librosys_fe_temp"
  Rename-Item "librosys_fe_temp" "frontend"
  Write-Host "Carpeta renombrada a frontend/"
}

Write-Host "Listo."
