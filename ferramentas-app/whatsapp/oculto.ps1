# Roda um comando numa área de trabalho INVISÍVEL do Windows (nada aparece na tela do Pedro) e espera o log terminar.
# uso: powershell -File oculto.ps1 <script.mjs> <nome-do-log> <perfil> [args extras...]
param([string]$Script, [string]$Log, [string]$Perfil, [Parameter(ValueFromRemainingArguments = $true)][string[]]$Extras)
$src = @'
using System; using System.Runtime.InteropServices; using System.Text;
public class Oculto {
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)] public static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevmode, int dwFlags, uint dwDesiredAccess, IntPtr lpsa);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public struct STARTUPINFO { public int cb; public string lpReserved; public string lpDesktop; public string lpTitle; public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags; public short wShowWindow, cbReserved2; public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError; }
  [StructLayout(LayoutKind.Sequential)] public struct PROCESS_INFORMATION { public IntPtr hProcess, hThread; public int dwProcessId, dwThreadId; }
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)] public static extern bool CreateProcess(string app, StringBuilder cmd, IntPtr pa, IntPtr ta, bool inherit, uint flags, IntPtr env, string cwd, ref STARTUPINFO si, out PROCESS_INFORMATION pi);
  public static int Abrir(string desktop, string cmd, string cwd) {
    IntPtr d = CreateDesktop(desktop, IntPtr.Zero, IntPtr.Zero, 0, 0x10000000, IntPtr.Zero);
    if (d == IntPtr.Zero) return -Marshal.GetLastWin32Error();
    STARTUPINFO si = new STARTUPINFO(); si.cb = Marshal.SizeOf(typeof(STARTUPINFO)); si.lpDesktop = desktop;
    PROCESS_INFORMATION pi;
    if (!CreateProcess(null, new StringBuilder(cmd), IntPtr.Zero, IntPtr.Zero, false, 0, IntPtr.Zero, cwd, ref si, out pi)) return -Marshal.GetLastWin32Error();
    return pi.dwProcessId;
  }
}
'@
Add-Type -TypeDefinition $src
$Aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$S = Join-Path $env:TEMP "sava-teste-whatsapp"; New-Item -ItemType Directory -Force $S | Out-Null
$velhos = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like "*$Perfil*" }
$velhos | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 800
$perfilDir = Join-Path $S $Perfil
if (Test-Path $perfilDir) { Remove-Item -Recurse -Force $perfilDir -Confirm:$false -ErrorAction SilentlyContinue }
$logPath = Join-Path $S $Log
if (Test-Path $logPath) { Remove-Item -Force $logPath -Confirm:$false }
$node = (Get-Command node).Source
$args2 = (@($Extras) | Where-Object { $_ } | ForEach-Object { '"' + $_ + '"' }) -join ' '
$cmd = 'cmd.exe /c ""' + $node + '" "' + (Join-Path $Aqui $Script) + '" "' + $logPath + '" "' + $perfilDir + '" ' + $args2 + ' > "' + $logPath + '.saida.txt" 2>&1"'
$procId = [Oculto]::Abrir("ClaudeOculto", $cmd, $S)
if ($procId -lt 0) { "erro ao abrir: $procId"; exit 1 }
for ($i = 0; $i -lt 70; $i++) { Start-Sleep 3; if ((Test-Path $logPath) -and (Select-String -Path $logPath -Pattern '^FIM|^ERRO' -Quiet)) { break } }
Get-Content $logPath -Encoding UTF8
$saida = Get-Content "$logPath.saida.txt" -ErrorAction SilentlyContinue | Select-Object -First 8
if ($saida) { "--- saida do node:"; $saida }
