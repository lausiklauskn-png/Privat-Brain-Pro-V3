# V3 neben Private Brain Pro (Klaus 2026-10-24): eine V3-Installation darf eine
# vorhandene Pro-Installation weder ersetzen noch deren Daten oder Registrierung
# beruehren. Geprueft mit dem echten, oeffentlich veroeffentlichten Pro-Installer.
$proVersion = '1.0.0-preview.29'
$proName = "Private-Brain-Pro-Windows-$proVersion-x64-setup.exe"
$proUrl = "https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/windows-v$proVersion/$proName"
$proSha256 = '55d5728a4623e079ac0303442c6ff94fe77c35621f1c935c0342d1cfeab52e97'
$proSize = 48562317
$proDir = Join-Path $env:LOCALAPPDATA 'Private Brain Pro'
$proData = Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.pro'
$proSentinel = Join-Path $proData 'v3-nachbar-probe.txt'
$proOpenWith = 'HKCU:\Software\Classes\Applications\private-brain-pro.exe\shell\open\command'
$v3Data = Join-Path $env:LOCALAPPDATA 'de.familyprojekt.privatebrain.v3'

function Get-ProUninstallKeys {
  @(Get-ChildItem 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall' -ErrorAction SilentlyContinue |
    Where-Object { (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).DisplayName -like 'Private Brain Pro*' } |
    ForEach-Object { $_.PSChildName })
}
function Get-ProSnapshot {
  $files = @(Get-ChildItem -LiteralPath $proDir -Recurse -File -ErrorAction SilentlyContinue | Sort-Object FullName |
    ForEach-Object { $_.FullName.Substring($proDir.Length) + '=' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash })
  $command = (Get-ItemProperty $proOpenWith -ErrorAction SilentlyContinue).'(default)'
  $sentinel = if (Test-Path $proSentinel) { Get-Content -Raw $proSentinel } else { '' }
  [pscustomobject]@{ Files = ($files -join "`n"); Count = $files.Count; OpenWith = $command; Uninstall = ((Get-ProUninstallKeys) -join ','); Sentinel = $sentinel }
}
function Install-ProNeighbour {
  if (Test-Path $proDir) { throw 'A Private Brain Pro installation already exists on the runner.' }
  $file = Join-Path $env:RUNNER_TEMP $proName
  Invoke-WebRequest -Uri $proUrl -OutFile $file -UseBasicParsing
  if ((Get-Item $file).Length -ne $proSize) { throw 'Downloaded Pro installer has an unexpected size.' }
  if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $proSha256) { throw 'Downloaded Pro installer has an unexpected SHA-256.' }
  $process = Start-Process -FilePath $file -ArgumentList '/S' -PassThru
  if (!$process.WaitForExit(180000)) { $process | Stop-Process -Force; throw 'Pro installer timed out.' }
  if ($process.ExitCode -ne 0) { throw "Pro installer failed: $($process.ExitCode)" }
  if (!(Test-Path (Join-Path $proDir 'private-brain-pro.exe'))) { throw 'Pro neighbour was not installed.' }
  New-Item -ItemType Directory -Force $proData | Out-Null
  Set-Content -LiteralPath $proSentinel -Value ('Pro-Daten, von V3 nie anzufassen ' + [guid]::NewGuid()) -NoNewline
  $script:proBefore = Get-ProSnapshot
  if ($script:proBefore.Count -lt 2 -or !$script:proBefore.OpenWith -or !$script:proBefore.Uninstall) { throw 'Pro neighbour snapshot is incomplete.' }
  Write-Output "PASS real Private Brain Pro $proVersion installed as neighbour ($($script:proBefore.Count) files)"
}
function Assert-ProNeighbourUntouched($when) {
  if ($appDir -eq $proDir -or $v3Data -eq $proData) { throw 'V3 uses the Pro installation or data folder.' }
  $now = Get-ProSnapshot
  foreach ($field in 'Files','OpenWith','Uninstall','Sentinel') {
    if ($now.$field -ne $script:proBefore.$field) { throw "V3 changed the Pro installation ($field) $when." }
  }
  Write-Output "PASS Private Brain Pro installation, data and registration unchanged $when"
}
function Assert-V3OwnIdentity {
  if (!(Test-Path $v3Data)) { throw 'V3 did not create its own data folder.' }
  $v3Keys = @(Get-ChildItem 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall' -ErrorAction SilentlyContinue |
    Where-Object { (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).DisplayName -like 'Private Brain V3*' })
  if ($v3Keys.Count -ne 1) { throw 'V3 has no separate uninstall entry.' }
  Write-Output 'PASS V3 uses its own folder, data folder and uninstall entry beside Pro'
}
function Remove-ProNeighbour {
  $uninstaller = Join-Path $proDir 'uninstall.exe'
  if (!(Test-Path $uninstaller)) { throw 'Pro neighbour uninstaller missing.' }
  $process = Start-Process -FilePath $uninstaller -ArgumentList '/S' -PassThru
  if (!$process.WaitForExit(180000)) { $process | Stop-Process -Force; throw 'Pro uninstaller timed out.' }
  $deadline = [DateTime]::UtcNow.AddSeconds(60)
  while ((Test-Path (Join-Path $proDir 'private-brain-pro.exe')) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 250 }
}
