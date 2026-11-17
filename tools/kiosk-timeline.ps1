param([int]$Interval = 3, [int]$Count = 6)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class KT {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
    public struct R { public int Left, Top, Right, Bottom; }
}
'@
[KT]::SetProcessDPIAware() | Out-Null
$proc = Get-Process Html4sPlayer -ErrorAction Stop
for ($i = 1; $i -le $Count; $i++) {
    $r = New-Object KT+R
    [KT]::GetWindowRect($proc.MainWindowHandle, [ref]$r) | Out-Null
    $bmp = New-Object System.Drawing.Bitmap(400, 160)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size(400, 160)))
    $bmp.Save("$env:TEMP\kiosk-t$i.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $c1 = $bmp.GetPixel(30, 30); $c2 = $bmp.GetPixel(200, 30)
    Write-Output ("t=" + ($i * $Interval) + "s  (30,30)=" + $c1.R + "," + $c1.G + "," + $c1.B + "  (200,30)=" + $c2.R + "," + $c2.G + "," + $c2.B)
    Start-Sleep -Seconds $Interval
}
