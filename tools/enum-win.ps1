Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class EW {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lp);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
    public delegate bool EnumProc(IntPtr h, IntPtr lp);
    public struct R { public int Left, Top, Right, Bottom; }
    public static void Run() {
        EnumWindows((h, lp) => {
            if (!IsWindowVisible(h)) return true;
            uint pid; GetWindowThreadProcessId(h, out pid);
            try {
                var p = System.Diagnostics.Process.GetProcessById((int)pid);
                if (p.ProcessName != "Html4sPlayer") return true;
                var sb = new StringBuilder(128); GetWindowText(h, sb, 128);
                R r; GetWindowRect(h, out r);
                Console.WriteLine(string.Format("pid={0} [{1}] rect=({2},{3})-({4},{5})",
                    pid, sb, r.Left, r.Top, r.Right, r.Bottom));
            } catch {}
            return true;
        }, IntPtr.Zero);
    }
}
'@
[EW]::SetProcessDPIAware() | Out-Null
[EW]::Run()
