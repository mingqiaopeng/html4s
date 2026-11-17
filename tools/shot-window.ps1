param([string]$OutFile = "$env:TEMP\h4s-launch.png")
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class LW {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
    public struct R { public int Left, Top, Right, Bottom; }
}
"@
[LW]::SetProcessDPIAware() | Out-Null
$proc = Get-Process Html4sPlayer -ErrorAction Stop
$r = New-Object LW+R
[LW]::GetWindowRect($proc.MainWindowHandle, [ref]$r) | Out-Null
$w = $r.Right - $r.Left; $ht = $r.Bottom - $r.Top
$bmp = New-Object System.Drawing.Bitmap($w, $ht)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size($w, $ht)))
$bmp.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "saved ${w}x${ht}"
