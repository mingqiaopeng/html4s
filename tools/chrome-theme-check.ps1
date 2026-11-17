param([string]$Deck = "D:\MyProjects\Html4s\examples\fs-intro.html4s", [switch]$Dark)
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class CT {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
    public struct R { public int Left, Top, Right, Bottom; }
}
"@
[CT]::SetProcessDPIAware() | Out-Null
$proc = Get-Process Html4sPlayer -ErrorAction Stop
[void]$proc.WaitForInputIdle(8000)
Start-Sleep -Seconds 4
$r = New-Object CT+R
[CT]::GetWindowRect($proc.MainWindowHandle, [ref]$r) | Out-Null
$w = $r.Right - $r.Left; $ht = $r.Bottom - $r.Top
$bmp = New-Object System.Drawing.Bitmap($w, 80)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size($w, 80)))
# 标题栏中心采样（避开文字与按钮）
$mid = $bmp.GetPixel([int]($w/2), 20)
$left = $bmp.GetPixel(700, 20)
$btnBg = $bmp.GetPixel($w - 115, 5)
Write-Output "mid=$mid left=$left btnTop=$btnBg rect=${w}x${ht}"
if ($Dark) { $bmp.Save("$env:TEMP\titlebar-dark.png", [System.Drawing.Imaging.ImageFormat]::Png) }
else { $bmp.Save("$env:TEMP\titlebar-check.png", [System.Drawing.Imaging.ImageFormat]::Png) }
