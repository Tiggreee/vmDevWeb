<#
.SYNOPSIS
  Copies vmDevWeb/.cursor/rules to your user profile and optionally to other git repos under the same parent folder (e.g. TripleTen).

.EXAMPLE
  .\scripts\sync-cursor-rules.ps1
  .\scripts\sync-cursor-rules.ps1 -SpreadToSiblingRepos
#>
param(
  [switch] $SpreadToSiblingRepos
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$src = Join-Path $repoRoot '.cursor\rules'
if (-not (Test-Path $src)) {
  Write-Error "Missing folder: $src"
}

$userRules = Join-Path $env:USERPROFILE '.cursor\rules'
New-Item -ItemType Directory -Force -Path $userRules | Out-Null
Copy-Item -Path (Join-Path $src '*.mdc') -Destination $userRules -Force
Write-Host "OK: copied $($((Get-ChildItem $src -Filter *.mdc).Count)) rules -> $userRules"

if ($SpreadToSiblingRepos) {
  $parent = Split-Path -Parent $repoRoot
  Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $gitDir = Join-Path $_.FullName '.git'
    $destRules = Join-Path $_.FullName '.cursor\rules'
    if (Test-Path $gitDir) {
      New-Item -ItemType Directory -Force -Path $destRules | Out-Null
      Copy-Item -Path (Join-Path $src '*.mdc') -Destination $destRules -Force
      Write-Host "OK: synced -> $destRules"
    }
  }
}

Write-Host ""
Write-Host "Para reglas GLOBALES en Cursor (todos los proyectos): abre"
Write-Host "  %USERPROFILE%\.cursor\global-user-rules-consolidated.md"
Write-Host "y pega su contenido en Cursor Settings -> Rules (User Rules)."
