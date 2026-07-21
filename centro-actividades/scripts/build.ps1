$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$jdk = Join-Path $root ".tools\jdk-17"
$mvn = Join-Path $root ".tools\apache-maven-3.9.6\bin\mvn.cmd"

if (-not (Test-Path "$jdk\bin\java.exe")) {
    Write-Error "JDK 17 no encontrado en .tools/jdk-17. Instálalo o ajusta JAVA_HOME."
}
if (-not (Test-Path $mvn)) {
    Write-Error "Maven no encontrado en .tools/apache-maven-3.9.6"
}

$env:JAVA_HOME = $jdk
$env:PATH = "$jdk\bin;$env:PATH"
Set-Location $root
& $mvn @args
