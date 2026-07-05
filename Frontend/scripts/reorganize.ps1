# LibroSys folder reorganization
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Ensure-Dir($p) { if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null } }

function Move-WithShim($from, $to) {
  $from = $from.Replace('\', '/')
  $to = $to.Replace('\', '/')
  if (!(Test-Path $from)) { Write-Host "SKIP missing: $from"; return }
  Ensure-Dir (Split-Path $to)
  if (Test-Path $to) { Remove-Item $to -Force }
  Move-Item $from $to -Force
  $fromRel = $from -replace '^src/', ''
  $toRel = ($to -replace '^src/', '') -replace '\.tsx?$', ''
  $fromDir = Split-Path $fromRel
  $depth = if ($fromDir) { ($fromDir -split '/').Count } else { 0 }
  $up = if ($depth -eq 0) { './' } else { ('../' * $depth) }
  Write-Shim $from "export * from '${up}${toRel}'`n"
  Write-Host "MOVED $from -> $to"
}

function Write-Shim($path, $content) {
  Ensure-Dir (Split-Path $path)
  [System.IO.File]::WriteAllText($path, $content)
}

function Move-Tree($srcDir, $destDir, $shimPrefix) {
  if (!(Test-Path $srcDir)) { return }
  Get-ChildItem $srcDir -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($srcDir.Length).TrimStart('\','/')
    $dest = Join-Path $destDir $rel
    Move-WithShim $_.FullName $dest
  }
}

# mocks
Ensure-Dir src/mocks
@{
  'src/data/mockData.ts'='src/mocks/mockCore.ts'
  'src/data/adminMockData.ts'='src/mocks/mockAdmin.ts'
  'src/data/salesMockData.ts'='src/mocks/mockVentas.ts'
  'src/data/eventsMockData.ts'='src/mocks/mockEventos.ts'
  'src/data/importsMockData.ts'='src/mocks/mockImportaciones.ts'
  'src/data/purchasesMockData.ts'='src/mocks/mockCompras.ts'
  'src/data/inventoryMockData.ts'='src/mocks/mockInventario.ts'
  'src/data/staffAssignmentData.ts'='src/mocks/mockStaff.ts'
  'src/data/usersMockData.ts'='src/mocks/mockUsuarios.ts'
  'src/data/auditMockData.ts'='src/mocks/mockAuditoria.ts'
  'src/data/configMockData.ts'='src/mocks/mockConfiguracion.ts'
  'src/data/helpMockData.ts'='src/mocks/mockAyuda.ts'
}.GetEnumerator() | ForEach-Object {
  Move-WithShim $_.Key $_.Value
}

# constants
Ensure-Dir src/constants
Move-WithShim 'src/business-rules/stateMachines.ts' 'src/constants/stateMachines.ts'

# assets
Ensure-Dir src/assets/styles
if (Test-Path 'src/index.css') { Move-WithShim 'src/index.css' 'src/assets/styles/index.css' }

# component categories
Ensure-Dir src/components/cards
Ensure-Dir src/components/tables
Ensure-Dir src/components/dialogs
@(
  @('src/components/ui/Card.tsx','src/components/cards/Card.tsx'),
  @('src/components/ui/Table.tsx','src/components/tables/Table.tsx'),
  @('src/components/ui/TableActions.tsx','src/components/tables/TableActions.tsx'),
  @('src/components/ui/FormDialog.tsx','src/components/dialogs/FormDialog.tsx'),
  @('src/components/ui/ConfirmDialog.tsx','src/components/dialogs/ConfirmDialog.tsx')
) | ForEach-Object { Move-WithShim $_[0] $_[1] }

# layouts
Ensure-Dir src/layouts
@(
  'src/pages/ventas/VentasLayout.tsx',
  'src/pages/compras/ComprasLayout.tsx',
  'src/pages/importaciones/ImportacionesLayout.tsx',
  'src/pages/editoriales/EditorialesLayout.tsx',
  'src/pages/reportes/ReportesLayout.tsx',
  'src/pages/auditoria/AuditoriaLayout.tsx',
  'src/pages/configuracion/ConfiguracionLayout.tsx'
) | ForEach-Object {
  $name = Split-Path $_ -Leaf
  Move-WithShim $_ "src/layouts/$name"
}

# hooks
Ensure-Dir src/hooks
Move-WithShim 'src/lib/useTableExport.ts' 'src/hooks/useTableExport.ts'

# eventos + ventas domain libs
Ensure-Dir src/modules/eventos/utils
Ensure-Dir src/modules/eventos/types
Ensure-Dir src/modules/ventas/utils
Ensure-Dir src/modules/ventas/types
Move-WithShim 'src/lib/eventBudget.ts' 'src/modules/eventos/utils/eventBudget.ts'
Move-WithShim 'src/lib/eventFieldLock.ts' 'src/modules/eventos/utils/eventFieldLock.ts'
Move-WithShim 'src/types/eventExtended.ts' 'src/modules/eventos/types/eventExtended.ts'
Move-WithShim 'src/lib/salesExchange.ts' 'src/modules/ventas/utils/salesExchange.ts'
Move-WithShim 'src/types/salesExchange.ts' 'src/modules/ventas/types/salesExchange.ts'

# module pages (trees)
Move-Tree 'src/pages/inventario' 'src/modules/inventario/pages' 'modules/inventario/pages'
Move-Tree 'src/pages/ventas' 'src/modules/ventas/pages' 'modules/ventas/pages'
Move-Tree 'src/pages/compras' 'src/modules/compras/pages' 'modules/compras/pages'
Move-Tree 'src/pages/importaciones' 'src/modules/importaciones/pages' 'modules/importaciones/pages'
Move-Tree 'src/pages/editoriales' 'src/modules/editoriales/pages' 'modules/editoriales/pages'
Move-Tree 'src/pages/eventos' 'src/modules/eventos/pages' 'modules/eventos/pages'
Move-Tree 'src/pages/usuarios' 'src/modules/usuarios/pages' 'modules/usuarios/pages'
Move-Tree 'src/pages/reportes' 'src/modules/reportes/pages' 'modules/reportes/pages'
Move-Tree 'src/pages/auditoria' 'src/modules/auditoria/pages' 'modules/auditoria/pages'
Move-Tree 'src/pages/configuracion' 'src/modules/configuracion/pages' 'modules/configuracion/pages'
Move-Tree 'src/pages/ayuda' 'src/modules/ayuda/pages' 'modules/ayuda/pages'
Move-Tree 'src/pages/admin' 'src/modules/admin/pages' 'modules/admin/pages'

@(
  @('src/pages/Dashboard.tsx','src/modules/dashboard/pages/Dashboard.tsx'),
  @('src/pages/Inventory.tsx','src/modules/inventario/pages/Inventory.tsx'),
  @('src/pages/Transfers.tsx','src/modules/transferencias/pages/Transfers.tsx'),
  @('src/pages/Events.tsx','src/modules/eventos/pages/Events.tsx'),
  @('src/pages/Users.tsx','src/modules/usuarios/pages/Users.tsx')
) | ForEach-Object { Move-WithShim $_[0] $_[1] }

# module components
@('ventas','eventos','compras','importaciones','inventario','admin') | ForEach-Object {
  Move-Tree "src/components/$_" "src/modules/$_/components" "modules/$_/components"
}

Write-Host 'Done.'
