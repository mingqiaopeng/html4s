// html4s 播放器桌面壳 v0.2.0（.NET + WebView2，自绘现代化标题栏）
// ------------------------------------------------
// 用法：
//   Html4sPlayer.exe deck.html4s        双击关联 / 指定本地文件
//   Html4sPlayer.exe https://...        打开网址播放
//   Html4sPlayer.exe deck.html4s --kiosk   kiosk 模式（隐藏标题栏、无边框置顶）
//   Ctrl+O 打开文件 · Ctrl+L 打开网址 · Ctrl+W 关闭 · F11 全屏
//   支持把 .html4s 文件直接拖进窗口；二次启动自动转发给已有实例（单实例激活）
//   排练结束后自动写回 <deck>.timings.json
//
// 关键机制：本地 deck 所在目录映射为虚拟主机 https://app.html4s.local/
// （CoreWebView2.SetVirtualHostNameToFolderMapping），使 file:// 双击场景
// 依然具备 http 同源语义 —— 演讲者双窗口的 BroadcastChannel 正常工作。

using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Html4sPlayer;

internal static class Program
{
    internal static CoreWebView2Environment? Env;
    internal static (string Host, string Dir)? VirtualHost;
    internal const string Host = "app.html4s.local";
    internal static string? InitialTarget;

    private const string MutexName = @"Local\Html4sPlayer.SingleInstance";
    private const string EventName = @"Local\Html4sPlayer.OpenEvent";
    internal static readonly string AppDataDir =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Html4s");
    internal static readonly string RecentPath = Path.Combine(AppDataDir, "recent.txt");

    /* 最近打开记录：一行一个 target（本地路径或网址），最新在前，最多 10 条 */
    internal static void RecordRecent(string target)
    {
        try
        {
            Directory.CreateDirectory(AppDataDir);
            var items = new List<string>();
            if (File.Exists(RecentPath))
                items.AddRange(File.ReadAllLines(RecentPath)
                    .Select(l => l.Trim()).Where(l => l.Length > 0));
            items.RemoveAll(x => string.Equals(x, target, StringComparison.OrdinalIgnoreCase));
            items.Insert(0, target);
            if (items.Count > 10) items.RemoveRange(10, items.Count - 10);
            File.WriteAllLines(RecentPath, items);
        }
        catch { }
    }

    internal static List<string> LoadRecent()
    {
        try
        {
            if (!File.Exists(RecentPath)) return new List<string>();
            return File.ReadAllLines(RecentPath)
                .Select(l => l.Trim()).Where(l => l.Length > 0).ToList();
        }
        catch { return new List<string>(); }
    }

    /* 应用设置（阶段4b）：界面语言覆盖等，持久化于 settings.json */
    internal sealed class AppSettings
    {
        public string Lang { get; set; } = "auto"; /* auto | zh | en */
    }
    internal static readonly string SettingsPath = Path.Combine(AppDataDir, "settings.json");
    internal static AppSettings LoadSettings()
    {
        try { return JsonSerializer.Deserialize<AppSettings>(File.ReadAllText(SettingsPath)) ?? new AppSettings(); }
        catch { return new AppSettings(); }
    }
    internal static void SaveSettings(AppSettings s)
    {
        try { File.WriteAllText(SettingsPath, JsonSerializer.Serialize(s)); } catch { }
    }
    internal static readonly string OpenQueuePath = Path.Combine(AppDataDir, "open.txt");
    internal static readonly string DebugLogPath = Path.Combine(AppDataDir, "debug.log");

    internal static void Log(string msg)
    {
        try { File.AppendAllText(DebugLogPath, DateTime.Now.ToString("HH:mm:ss.fff") + " " + msg + Environment.NewLine); }
        catch { }
    }

    [STAThread]
    private static int Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        Directory.CreateDirectory(AppDataDir);

        if (args.Contains("--selftest-dpi")) return DpiSelfTest();

        bool kiosk = args.Contains("--kiosk");
        string? target = args.FirstOrDefault(a => !a.StartsWith("--"));
        if (string.IsNullOrWhiteSpace(target))
        {
            target = ChooseTarget();
            if (target == null) return 0;
        }

        /* 单实例激活：已有实例时把目标转发过去（open.txt + 事件），本进程退出 */
        using var mutex = new Mutex(true, MutexName, out var createdNew);
        if (!createdNew)
        {
            Log("[B] 第二实例，转发: " + target);
            try
            {
                File.WriteAllText(OpenQueuePath, target);
                using var ev = EventWaitHandle.OpenExisting(EventName);
                ev.Set();
                Log("[B] 事件已置位");
            }
            catch (Exception ex)
            {
                Log("[B] 转发失败: " + ex.Message);
            }
            return 0;
        }
        Log("[A] 首实例启动: " + target);

        string url;
        if (Uri.TryCreate(target, UriKind.Absolute, out var u) && u.Scheme is "http" or "https")
        {
            url = target;
        }
        else
        {
            string full = Path.GetFullPath(target);
            if (!File.Exists(full))
            {
                MessageBox.Show("找不到文件：\n" + full, "html4s 播放器",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return 1;
            }
            url = LocalToVirtualUrl(full)!; /* 内部会设置 VirtualHost（映射根可能上移） */
        }
        InitialTarget = File.Exists(target) ? Path.GetFullPath(target) : null;
        RecordRecent(target); /* 最近打开：首实例记录（二次启动走 OpenLocalFile 记录） */

        try
        {
            Env = CoreWebView2Environment.CreateAsync().GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            MessageBox.Show("WebView2 初始化失败（请确认系统已安装 WebView2 运行时）：\n" + ex.Message,
                "html4s 播放器", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }

        using var openEvent = new EventWaitHandle(false, EventResetMode.AutoReset, EventName);
        /* kiosk 状态传给播放器：#/kiosk 深链 → 直接放映 + 循环 + 隐藏工具条 */
        if (kiosk) { url += "#/kiosk"; Program.Log("[A] kiosk URL: " + url); }
        Application.Run(new StageWindow(url, kiosk));
        return 0;
    }

    private static string? ChooseTarget()
    {
        using var ofd = new OpenFileDialog
        {
            Title = "打开 html4s 演示",
            Filter = "html4s 演示|*.html4s;*.html;*.htm|所有文件|*.*"
        };
        if (ofd.ShowDialog() == DialogResult.OK) return ofd.FileName;
        return Prompt.ShowDialog("输入演示网址（http / https）：", "打开网址");
    }

    internal static string? LocalToVirtualUrl(string fullFile)
    {
        string full = Path.GetFullPath(fullFile);
        string deckDir = Path.GetDirectoryName(full)!;
        string name = Path.GetFileName(full);

        // WebView2 虚拟主机按扩展名推断 MIME，.html4s 会被当下载而非渲染
        // （且虚拟主机顶层请求不触发 WebResourceRequested，无法拦改）。
        // 方案：同目录生成隐藏的 .html 镜像（相对资源引用不变），每次打开刷新。
        string shim = Path.Combine(deckDir,
            Path.GetFileNameWithoutExtension(name) + ".h4srender.html");
        try { if (File.Exists(shim)) File.SetAttributes(shim, FileAttributes.Normal); }
        catch { /* 清属性失败时由 Copy 报错 */ }
        File.Copy(full, shim, true);
        try { File.SetAttributes(shim, FileAttributes.Hidden); } catch { }

        // 相对引用可能向上逃逸出 deck 目录（如 src="../player/h4s.player.js"）。
        // 统计最大 "../" 层数，把虚拟主机根相应上移，保证 ../ 引用仍可解析。
        int up = 0;
        try
        {
            string html = File.ReadAllText(full);
            foreach (Match m in Regex.Matches(html, "(?:src|href)=\"((?:\\.\\./)+)",
                     RegexOptions.IgnoreCase))
                up = Math.Max(up, m.Groups[1].Value.Length / 3);
        }
        catch { /* 读不出就按 0 层处理 */ }
        up = Math.Min(up, 12);

        string root = deckDir;
        string relDir = "";
        for (int i = 0; i < up; i++)
        {
            var parent = Directory.GetParent(root);
            if (parent == null) break;
            relDir = Path.Combine(Path.GetFileName(root), relDir);
            root = parent.FullName;
        }

        VirtualHost = (Host, root);
        string relShim = relDir.Length > 0
            ? Path.Combine(relDir, Path.GetFileName(shim))
            : Path.GetFileName(shim);
        string urlPath = string.Join("/",
            relShim.Replace('\\', '/').Split('/').Select(Uri.EscapeDataString));
        // 缓存指纹：deck 文件的修改时间 —— 文件变更后 URL 随之变化，杜绝 WebView2 缓存旧响应
        var stamp = DateTime.Now.Ticks; /* 每次打开唯一 → 彻底避免 WebView2 缓存 */
        return $"https://{Host}/{urlPath}?t={stamp}";
    }

    /// <summary>配置虚拟主机目录映射（保证本地 deck 具有 http 同源语义）。</summary>
    internal static void ConfigureVirtualHost(CoreWebView2 core, (string Host, string Dir) vh)
    {
        core.SetVirtualHostNameToFolderMapping(vh.Host, vh.Dir,
            CoreWebView2HostResourceAccessKind.Allow);
    }

    /* ---- 高 DPI：对话框几何按宿主屏真实 DPI 手动缩放 ----
       PMv2 进程里 WinForms 不会替运行时 new 出来的窗体做缩放：AutoScaleMode.Dpi
       的基线在设置当场被捕获为当前 DPI，系数恒为 1（改了等于没改）。
       与 StageWindow 标题栏同用手动缩放；基准取宿主窗口所在屏的 DPI
       （GetDpiForWindow），无宿主时退回系统 DPI。 */
    [DllImport("user32.dll")]
    private static extern uint GetDpiForWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    private static extern uint GetDpiForSystem();
    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")]
    private static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);
    [StructLayout(LayoutKind.Sequential)]
    private struct RECT { public int Left, Top, Right, Bottom; }

    /* PrintWindow 直接渲染目标窗口自身到位图（与 z 序/遮挡无关，不会误抓其他窗口） */
    internal static void SnapWindow(Control c, string path)
    {
        try
        {
            GetWindowRect(c.Handle, out var r);
            int w = r.Right - r.Left, h = r.Bottom - r.Top;
            if (w <= 0 || h <= 0) { Log("[selftest] 截图跳过（尺寸异常 " + w + "x" + h + "）"); return; }
            using var bmp = new System.Drawing.Bitmap(w, h);
            using var g = System.Drawing.Graphics.FromImage(bmp);
            var hdc = g.GetHdc();
            PrintWindow(c.Handle, hdc, 2 /*PW_RENDERFULLCONTENT*/);
            g.ReleaseHdc(hdc);
            bmp.Save(path, System.Drawing.Imaging.ImageFormat.Png);
            Log("[selftest] 截图: " + path);
        }
        catch (Exception ex) { Log("[selftest] 截图失败: " + ex.Message); }
    }

    internal static float DpiScale(IWin32Window? owner)
    {
        try
        {
            if (owner != null && owner.Handle != IntPtr.Zero && GetDpiForWindow(owner.Handle) > 0)
                return GetDpiForWindow(owner.Handle) / 96f;
            return GetDpiForSystem() / 96f;
        }
        catch { return 1f; }
    }

    /* --selftest-dpi：不截屏（会误抓其他窗口），把"打开网址"对话框的真实几何
       写入 debug.log 后自动关闭。覆盖两条路径：无宿主（启动选文件后的网址输入）
       + 逐显示器有宿主（Ctrl+L 真实流程，宿主强制落在该屏）——验证缩放生效、
       控件不越界、窗口不被框架二次改尺寸。 */
    private static int DpiSelfTest()
    {
        Log("[selftest] shell v" + Application.ProductVersion + " systemDpi=" + GetDpiForSystem() + " screens=" + string.Join(" | ",
            Screen.AllScreens.Select(s => s.DeviceName + " " + s.Bounds + (s.Primary ? " (主)" : ""))));
        /* 探针：运行时 new 的窗体设 AutoScaleMode.Dpi 后基线是否仍是当前 DPI（=不缩放） */
        using (var probe = new Form { AutoScaleMode = AutoScaleMode.Dpi })
        {
            _ = probe.Handle;
            Log("[selftest] probe AutoScaleMode.Dpi：dims=" + probe.AutoScaleDimensions
                + " current=" + probe.CurrentAutoScaleDimensions
                + " deviceDpi=" + probe.DeviceDpi
                + (probe.AutoScaleDimensions == probe.CurrentAutoScaleDimensions ? "（基线=当前 → 系数1，不缩放）" : ""));
        }
        MeasurePrompt(null, "无宿主");
        foreach (var screen in Screen.AllScreens)
            MeasurePrompt(screen, "宿主@" + screen.DeviceName);
        Log("[selftest] done");
        return 0;
    }

    /* 复刻 OpenUrlViaPrompt 真实流程：Build(text,title,DpiScale(owner)) + CenterParent + ShowDialog(owner)，
       Shown 时测量最终几何（窗口被框架调整后的真实状态） */
    private static void MeasurePrompt(Screen? forceScreen, string tag)
    {
        Form? owner = null;
        if (forceScreen != null)
        {
            owner = new Form
            {
                StartPosition = FormStartPosition.Manual,
                FormBorderStyle = FormBorderStyle.None,
                Bounds = new Rectangle(forceScreen.WorkingArea.X + 80,
                    forceScreen.WorkingArea.Y + 80, 900, 620),
            };
            _ = owner.Handle; /* 句柄落在目标屏 */
        }
        try
        {
            float sc = DpiScale(owner);
            var (form, _) = Prompt.Build("输入演示网址（http / https）：", "打开网址", sc);
            form.StartPosition = owner == null ? FormStartPosition.CenterScreen : FormStartPosition.CenterParent;
            form.Shown += async (_, _) =>
            {
                try
                {
                    var cs = form.ClientSize;
                    Log("[selftest][" + tag + "] buildSc=" + sc.ToString("F2")
                        + " ownerDpi=" + (owner != null ? GetDpiForWindow(owner.Handle).ToString() : GetDpiForSystem().ToString())
                        + " → clientSize=" + cs.Width + "x" + cs.Height
                        + " formBounds=" + form.Bounds + " deviceDpi=" + form.DeviceDpi);
                    foreach (Control c in form.Controls)
                        Log("[selftest][" + tag + "]   " + c.GetType().Name + " " + c.Bounds
                            + (c.Right <= cs.Width && c.Bottom <= cs.Height ? " fits" : " *** 越界 ***"));
                    await Task.Delay(400); /* 等首帧完全绘制后再拍，排除捕获时机伪影 */
                    SnapWindow(form, Path.Combine(AppDataDir, "prompt-selftest-" + tag.Replace('@', '-').Replace('\\', '-').Replace('.', '-') + ".png"));
                }
                finally { form.Close(); }
            };
            form.ShowDialog(owner);
        }
        finally { owner?.Dispose(); }
    }
}

internal static class Prompt
{
    /* 输入对话框：96-DPI 设计值 → 按宿主屏真实 DPI 手动缩放（S()）。
       字体用像素单位，几何完全确定（同 StageWindow 标题栏套路）。 */
    internal static (Form Form, TextBox Box) Build(string text, string title, float sc)
    {
        int S(int v) => (int)Math.Round(v * sc);
        var form = new Form
        {
            Text = title,
            AutoScaleMode = AutoScaleMode.None,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false, MinimizeBox = false,
            ClientSize = new Size(S(560), S(170)),
            Font = new Font("Microsoft YaHei UI", S(13), GraphicsUnit.Pixel),
        };
        var label = new Label { Left = S(14), Top = S(16), AutoSize = true, Text = text };
        var box = new TextBox { Left = S(14), Top = S(48), Width = S(530) };
        var ok = new Button { Text = "确定", Left = S(324), Top = S(110), Width = S(110), Height = S(34), DialogResult = DialogResult.OK };
        var cancel = new Button { Text = "取消", Left = S(442), Top = S(110), Width = S(104), Height = S(34), DialogResult = DialogResult.Cancel };
        form.Controls.AddRange(new Control[] { label, box, ok, cancel });
        form.AcceptButton = ok;
        form.CancelButton = cancel;
        return (form, box);
    }

    public static string? ShowDialog(string text, string title, IWin32Window? owner = null)
    {
        var (form, box) = Build(text, title, Program.DpiScale(owner));
        form.StartPosition = owner == null ? FormStartPosition.CenterScreen : FormStartPosition.CenterParent;
        return form.ShowDialog(owner) == DialogResult.OK ? box.Text.Trim() : null;
    }
}

internal class StageWindow : Form
{
    private readonly WebView2 _wv = new() { Dock = DockStyle.Fill };
    private readonly Panel _titleBar;
    private readonly Label _titleLabel;
    private readonly Label _appLabel;
    private readonly List<CaptionButton> _capBtns = new();
    private readonly CaptionButton _btnMax;
    private readonly string _url;
    private readonly bool _kiosk;
    private bool _playerOk;
    private bool _isFullScreen;
    private string? _deckFile;
    private readonly int _btnW;
    private readonly int _tbH;

    /* 无边框窗口的拖拽 / 原生标题行为 */
    private const int WM_NCLBUTTONDOWN = 0xA1;
    private const int HTCAPTION = 0x2;

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();
    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

    public StageWindow(string url, bool kiosk)
    {
        _url = url;
        _kiosk = kiosk;
        Text = "html4s 播放器";
        BackColor = Color.FromArgb(13, 17, 23);
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(1280, 760);
        WindowState = FormWindowState.Maximized;
        FormBorderStyle = FormBorderStyle.None;   /* 自绘标题栏 */
        KeyPreview = true;
        AllowDrop = true;

        /* ---- 自绘标题栏（手动按 DPI 缩放） ---- */
        AutoScaleMode = AutoScaleMode.None;
        float sc = DeviceDpi / 96f;
        _btnW = (int)(46 * sc);
        _tbH = (int)(40 * sc);
        _titleBar = new Panel
        {
            Dock = DockStyle.Top,
            Height = _tbH,
            BackColor = Color.FromArgb(13, 17, 23)
        };

        var appLabel = new Label
        {
            Text = "html4s",
            AutoSize = true,
            ForeColor = Color.FromArgb(125, 211, 252),
            Font = new Font("Segoe UI", (int)(15 * sc), FontStyle.Bold, GraphicsUnit.Pixel),
            Location = new Point((int)(14 * sc), (_tbH - (int)(20 * sc)) / 2),
            BackColor = Color.Transparent
        };
        _appLabel = appLabel;
        _titleLabel = new Label
        {
            Text = "",
            AutoEllipsis = true,
            ForeColor = Color.FromArgb(148, 163, 184),
            Font = new Font("Segoe UI", (int)(13 * sc), GraphicsUnit.Pixel),
            Location = new Point((int)(84 * sc), (_tbH - (int)(18 * sc)) / 2),
            Size = new Size(600, (int)(18 * sc)),
            BackColor = Color.Transparent
        };

        var btnMin = new CaptionButton(CaptionButton.Kind.Min, "最小化");
        _btnMax = new CaptionButton(CaptionButton.Kind.Max, "最大化 / 还原");
        var btnClose = new CaptionButton(CaptionButton.Kind.Close, "关闭（Ctrl+W）");
        btnClose.HoverBack = Color.FromArgb(232, 17, 35);
        btnClose.HoverFore = Color.White;
        _capBtns.AddRange(new[] { btnMin, _btnMax, btnClose });

        btnMin.Click += (_, _) => WindowState = FormWindowState.Minimized;
        _btnMax.Click += (_, _) => ToggleMax();
        btnClose.Click += (_, _) => Close();

        _titleBar.Controls.AddRange(new Control[]
        {
            _titleLabel, appLabel, btnMin, _btnMax, btnClose
        });
        LayoutTitleButtons(btnMin, _btnMax, btnClose);
        _titleBar.Resize += (_, _) => LayoutTitleButtons(btnMin, _btnMax, btnClose);

        /* 标题栏拖拽移动 / 双击最大化 */
        _titleBar.MouseDown += TitleBarMouseDown;
        appLabel.MouseDown += TitleBarMouseDown;
        _titleLabel.MouseDown += TitleBarMouseDown;
        _titleBar.DoubleClick += (_, _) => ToggleMax();
        /* 标题栏右键 → 最近打开 */
        _titleBar.MouseUp += TitleBarRightClick;
        appLabel.MouseUp += TitleBarRightClick;
        _titleLabel.MouseUp += TitleBarRightClick;

        /* 拖拽文件打开 */
        DragEnter += (_, e) =>
        {
            if (e.Data?.GetDataPresent(DataFormats.FileDrop) == true)
                e.Effect = DragDropEffects.Copy;
        };
        DragDrop += (_, e) =>
        {
            if (e.Data?.GetData(DataFormats.FileDrop) is string[] files && files.Length > 0
                && File.Exists(files[0]))
                OpenLocalFile(files[0]);
        };

        Controls.Add(_wv);
        Controls.Add(_titleBar);

        KeyDown += (_, e) =>
        {
            if (e.KeyCode == Keys.F11) ToggleFullscreen();
            if (e.Control && e.KeyCode == Keys.L) OpenUrlViaPrompt();
            if (e.Control && e.KeyCode == Keys.O) OpenFileViaDialog();
            if (e.Control && e.KeyCode == Keys.R) ShowRecent();
            if (e.Control && e.KeyCode == Keys.Oemcomma) ShowSettings();
            if (e.Control && e.KeyCode == Keys.W) Close();
        };

        Shown += async (_, _) => await InitAsync();

        /* 单实例激活：轮询转发队列（第二实例写入的 open.txt） */
        var poll = new System.Windows.Forms.Timer { Interval = 400 };
        poll.Tick += (_, _) =>
        {
            try
            {
                if (File.Exists(Program.OpenQueuePath))
                {
                    var t = File.ReadAllText(Program.OpenQueuePath).Trim();
                    File.Delete(Program.OpenQueuePath);
                    Program.Log("[A] 队列消费: " + t);
                    if (t.Length > 0)
                    {
                        OpenTarget(t);
                        Activate();
                    }
                }
            }
            catch { }
        };
        poll.Start();

        FormClosing += (_, e) =>
        {
            if (_isFullScreen)
            {
                var r = MessageBox.Show("正在放映中，确定退出 html4s 播放器？", "关闭",
                    MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (r == DialogResult.No) e.Cancel = true;
            }
        };

        if (kiosk)
        {
            _titleBar.Visible = false;
            WindowState = FormWindowState.Maximized;
            TopMost = true;
        }
    }

    /* 标题栏右键 → 上下文菜单（最近打开 / 设置 / 关于） */
    private void TitleBarRightClick(object? sender, MouseEventArgs e)
    {
        if (e.Button != MouseButtons.Right) return;
        var menu = new ContextMenuStrip();
        menu.Items.Add("最近打开", null, (_, _) => ShowRecent());
        menu.Items.Add("设置…", null, (_, _) => ShowSettings());
        menu.Items.Add("关于", null, (_, _) => MessageBox.Show(
            "html4s 播放器 " + Application.ProductVersion + "\nhtml4s 格式 + PowerPoint 习惯的播放器\nhttps://github.com/mingqiaopeng/html4s",
            "关于 html4s", MessageBoxButtons.OK, MessageBoxIcon.Information));
        menu.Show(_titleBar, e.Location);
    }

    /* 语言注入：在页面脚本运行前写/清 localStorage（player boot 读取 h4s-lang-override）。
       设置变更后重新注册——按注册顺序执行，最后注册者生效。 */
    private void RegisterLangInjection()
    {
        var lang = Program.LoadSettings().Lang;
        var script = "try{localStorage.removeItem('h4s-lang-override');"
            + (lang == "zh" || lang == "en" ? "localStorage.setItem('h4s-lang-override','" + lang + "');" : "")
            + "}catch(e){}";
        _wv.CoreWebView2?.AddScriptToExecuteOnDocumentCreatedAsync(script);
    }

    /* 设置对话框（Ctrl+, / 标题栏右键）：语言覆盖 + 清空最近 + 关于。
       几何按宿主屏真实 DPI 手动缩放（同 Prompt 套路）。 */
    private void ShowSettings()
    {
        var s = Program.LoadSettings();
        int S(int v) => (int)Math.Round(v * Program.DpiScale(this));
        using var form = new Form
        {
            Text = "设置",
            AutoScaleMode = AutoScaleMode.None,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false, MinimizeBox = false,
            ClientSize = new Size(S(420), S(190)),
            StartPosition = FormStartPosition.CenterParent,
            Font = new Font("Microsoft YaHei UI", S(13), GraphicsUnit.Pixel),
        };
        var lbl = new Label { Left = S(14), Top = S(16), AutoSize = true, Text = "界面语言（对新打开的演示生效）：" };
        var combo = new ComboBox { Left = S(14), Top = S(44), Width = S(220), DropDownStyle = ComboBoxStyle.DropDownList };
        combo.Items.AddRange(new object[] { "跟随演示（默认）", "中文", "English" });
        combo.SelectedIndex = s.Lang == "en" ? 2 : s.Lang == "zh" ? 1 : 0;
        var btnClear = new Button { Text = "清空最近打开", Left = S(14), Top = S(96), Width = S(160), Height = S(34) };
        btnClear.Click += (_, _) =>
        {
            try { File.WriteAllText(Program.RecentPath, ""); MessageBox.Show(form, "已清空。", "最近打开", MessageBoxButtons.OK, MessageBoxIcon.Information); }
            catch (Exception ex) { MessageBox.Show(form, "清空失败：" + ex.Message, "最近打开", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
        };
        var about = new Label
        {
            Left = S(14), Top = S(148), AutoSize = true,
            Text = "html4s 播放器 " + Application.ProductVersion,
            ForeColor = Color.Gray
        };
        var ok = new Button { Text = "确定", Left = S(200), Top = S(140), Width = S(96), Height = S(34), DialogResult = DialogResult.OK };
        var cancel = new Button { Text = "取消", Left = S(308), Top = S(140), Width = S(96), Height = S(34), DialogResult = DialogResult.Cancel };
        form.Controls.AddRange(new Control[] { lbl, combo, btnClear, about, ok, cancel });
        form.AcceptButton = ok;
        form.CancelButton = cancel;
        var before = combo.SelectedIndex;
        if (form.ShowDialog(this) == DialogResult.OK && combo.SelectedIndex != before)
        {
            s.Lang = combo.SelectedIndex == 2 ? "en" : combo.SelectedIndex == 1 ? "zh" : "auto";
            Program.SaveSettings(s);
            RegisterLangInjection();
            if (_wv.CoreWebView2 != null && MessageBox.Show(form,
                "语言设置对新打开的演示生效。立即重新加载当前演示？", "设置",
                MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes && _wv.CoreWebView2.Source != null)
                NavigateTo(_wv.CoreWebView2.Source);
        }
    }

    private void LayoutTitleButtons(Control min, Control max, Control close)
    {
        int w = _titleBar.Width;
        _titleBar.Height = _tbH;
        foreach (var b in new[] { min, max, close })
        {
            b.Size = new Size(_btnW, _tbH); /* DPI 迁移后 WinForms 会错误重缩放，这里强制纠正 */
            b.Top = 0;
        }
        close.Left = w - _btnW;
        max.Left = w - _btnW * 2;
        min.Left = w - _btnW * 3;
        _titleLabel.Width = Math.Max(200, min.Left - _titleLabel.Left - 20);
    }

    private void TitleBarMouseDown(object? sender, MouseEventArgs e)
    {
        if (e.Button == MouseButtons.Left)
        {
            ReleaseCapture();
            SendMessage(Handle, WM_NCLBUTTONDOWN, HTCAPTION, IntPtr.Zero);
        }
    }

    private void ToggleMax()
    {
        WindowState = WindowState == FormWindowState.Maximized
            ? FormWindowState.Normal : FormWindowState.Maximized;
    }

    private void ToggleFullscreen()
    {
        _isFullScreen = !_isFullScreen;
        _titleBar.Visible = !_isFullScreen && !_kiosk;
        TopMost = _isFullScreen || _kiosk;
    }

    /* ---- 打开 ---- */
    private void OpenTarget(string t)
    {
        if (Uri.TryCreate(t, UriKind.Absolute, out var u) && u.Scheme is "http" or "https") NavigateTo(t);
        else OpenLocalFile(t);
    }

    private void OpenFileViaDialog()
    {
        using var ofd = new OpenFileDialog
        {
            Title = "打开 html4s 演示",
            Filter = "html4s 演示|*.html4s;*.html;*.htm|所有文件|*.*"
        };
        if (ofd.ShowDialog() == DialogResult.OK) OpenLocalFile(ofd.FileName);
    }

    private void OpenUrlViaPrompt()
    {
        string? s = Prompt.ShowDialog("输入演示网址（http / https）：", "打开网址", this);
        if (string.IsNullOrWhiteSpace(s)) return;
        s = s.Trim();
        if (Uri.TryCreate(s, UriKind.Absolute, out var u) && u.Scheme is "http" or "https")
        {
            Program.RecordRecent(s);
            NavigateTo(s);
        }
        else
            MessageBox.Show("不是有效的网址：" + s, "html4s 播放器",
                MessageBoxButtons.OK, MessageBoxIcon.Warning);
    }

    private void OpenLocalFile(string path)
    {
        if (!File.Exists(path))
        {
            MessageBox.Show("找不到文件：\n" + path, "html4s 播放器",
                MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        _deckFile = Path.GetFullPath(path);
        Program.RecordRecent(_deckFile);
        string url = Program.LocalToVirtualUrl(path)!;
        NavigateTo(url);
    }

    /* 最近打开：列表对话框（Ctrl+R / 标题栏右键） */
    private void ShowRecent()
    {
        var items = Program.LoadRecent();
        if (items.Count == 0)
        {
            MessageBox.Show("暂无最近打开的记录。", "最近打开",
                MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }
        /* 几何按宿主屏真实 DPI 手动缩放（同 Prompt / 标题栏套路） */
        float sc = Program.DpiScale(this);
        int S(int v) => (int)Math.Round(v * sc);
        using var form = new Form
        {
            Text = "最近打开",
            ClientSize = new Size(S(620), S(360)),
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MinimizeBox = false,
            MaximizeBox = false,
            AutoScaleMode = AutoScaleMode.None,
            Font = new Font("Microsoft YaHei UI", S(13), GraphicsUnit.Pixel)
        };
        var lb = new ListBox { Dock = DockStyle.Fill, IntegralHeight = false };
        foreach (var it in items) lb.Items.Add(it);
        void OpenSelected()
        {
            if (lb.SelectedItem is not string sel) return;
            form.Close();
            OpenTarget(sel);
        }
        lb.DoubleClick += (_, _) => OpenSelected();
        var btns = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom, FlowDirection = FlowDirection.RightToLeft,
            Height = S(52), Padding = new Padding(S(8))
        };
        var btnCancel = new Button { Text = "取消", Width = S(90), Height = S(36), Margin = Padding.Empty };
        var btnOpen = new Button { Text = "打开", Width = S(90), Height = S(36), Margin = Padding.Empty };
        btnCancel.Click += (_, _) => form.Close();
        btnOpen.Click += (_, _) => OpenSelected();
        btns.Controls.Add(btnCancel);
        btns.Controls.Add(btnOpen);
        form.Controls.Add(lb);
        form.Controls.Add(btns);
        form.AcceptButton = btnOpen;
        form.ShowDialog(this);
    }

    private void NavigateTo(string url)
    {
        var core = _wv.CoreWebView2;
        if (core == null) return;
        if (Program.VirtualHost is { } vh)
            Program.ConfigureVirtualHost(core, vh);
        core.Navigate(url);
    }

    /* ---- 初始化 ---- */
    private async Task InitAsync()
    {
        _wv.DefaultBackgroundColor = Color.FromArgb(11, 15, 20);
        await _wv.EnsureCoreWebView2Async(Program.Env);
        var core = _wv.CoreWebView2;
        if (Program.VirtualHost is { } vh)
        {
            Program.ConfigureVirtualHost(core, vh);
        }
        _deckFile = Program.InitialTarget; /* 初始 deck 路径（排练写回用） */
        core.DocumentTitleChanged += (_, _) => UpdateTitles();
        /* 网页 requestFullscreen（点"▶ 放映"/F5）→ 隐藏标题栏、置顶覆盖任务栏；
           退出放映（Esc）→ 恢复浏览窗口 */
        core.ContainsFullScreenElementChanged += (_, _) =>
        {
            if (core.ContainsFullScreenElement)
            {
                _isFullScreen = true;
                _titleBar.Visible = false;
                WindowState = FormWindowState.Maximized;
                TopMost = true;
            }
            else
            {
                _isFullScreen = false;
                _titleBar.Visible = !_kiosk;
                TopMost = _kiosk;
            }
        };
        core.NewWindowRequested += OnNewWindow;
        core.Settings.AreDefaultContextMenusEnabled = false;
        /* 注入主题观察器：body[data-ui] 一旦出现/变化即上报。
           新版播放器会主动发 theme 消息，此观察器兜底覆盖旧版内嵌播放器的 deck。 */
        const string themeObserver =
            "(function(){function post(t){try{window.chrome.webview.postMessage(JSON.stringify({h4sShell:'theme',data:t}))}catch(e){}}" +
            "var cur=null;function check(){var b=document.body;if(!b)return;var t=b.getAttribute('data-ui');if(t&&t!==cur){cur=t;post(t)}}" +
            /* document-created 时 documentElement 可能为 null —— observer 必须等 DOM 挂好再注册 */
            "document.addEventListener('DOMContentLoaded',function(){check();try{new MutationObserver(check).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['data-ui']})}catch(e){}});" +
            "check();})();";
        core.AddScriptToExecuteOnDocumentCreatedAsync(themeObserver);
        RegisterLangInjection(); /* 设置里的语言覆盖（每页脚本运行前生效） */
        /* 播放器 JS 转发过来的壳级快捷键 + 排练计时写回 */
        core.WebMessageReceived += OnWebMessage;
        core.Navigate(_url);
        _ = DiagnosePlayerLoad(core);
    }

    private void OnWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            if (!(e.WebMessageAsJson ?? "").Contains("h4sShell")) return;
            var root = JsonDocument.Parse(e.WebMessageAsJson).RootElement;
            /* JS 侧 postMessage(JSON.stringify({...})) 传字符串时，WebMessageAsJson 是
               双重编码（字符串字面量内含 JSON）——解包一层才能拿到对象。此前 String
               节点上调 TryGetProperty 抛异常被吞，所有 JS→壳消息（握手/主题/排练写回）
               实际从未生效，一直靠壳侧兜底在撑。 */
            if (root.ValueKind == JsonValueKind.String)
                root = JsonDocument.Parse(root.GetString()).RootElement;
            if (!root.TryGetProperty("h4sShell", out var act)) return;
            switch (act.GetString())
            {
                case "hello": /* 握手应答：让页面确认 shell 可用 */
                    ((CoreWebView2)sender).PostWebMessageAsString(System.Text.Json.JsonSerializer.Serialize(new { h4sShellHello = true }));
                    break;
                case "fullscreen": ToggleFullscreen(); break;
                case "exitfullscreen": /* 播放器 Esc 回浏览时同步退出壳 F11 无边框全屏（网页全屏事件不覆盖它） */
                    if (_isFullScreen) ToggleFullscreen();
                    break;
                case "openurl": OpenUrlViaPrompt(); break;
                case "openfile": OpenFileViaDialog(); break;
                case "recent": ShowRecent(); break;
                case "close": Close(); break;
                case "timings": /* 排练计时写回 deck 同名 .timings.json */
                    if (!string.IsNullOrEmpty(_deckFile) && root.TryGetProperty("data", out var data))
                    {
                        File.WriteAllText(_deckFile + ".timings.json", data.GetRawText());
                        Program.Log("[A] 排练计时已写回: " + _deckFile + ".timings.json");
                    }
                    break;
                case "save": /* 文字微调写回：deck HTML 写回源文件 + 同步刷新 shim 镜像 */
                    if (root.TryGetProperty("data", out var sv) && sv.TryGetProperty("html", out var htmlEl))
                    {
                        if (string.IsNullOrEmpty(_deckFile))
                        {
                            ((CoreWebView2)sender).PostWebMessageAsString("{\"h4sSaved\":false,\"reason\":\"deck-from-url\"}");
                            break;
                        }
                        try
                        {
                            var newHtml = htmlEl.GetString();
                            File.WriteAllText(_deckFile, newHtml); /* UTF-8 无 BOM（与构建产物一致） */
                            var shim = Path.Combine(Path.GetDirectoryName(_deckFile)!,
                                Path.GetFileNameWithoutExtension(_deckFile) + ".h4srender.html");
                            try { if (File.Exists(shim)) File.SetAttributes(shim, FileAttributes.Normal); } catch { }
                            File.WriteAllText(shim, newHtml);
                            Program.Log("[A] 文字微调已写回: " + _deckFile + "（含 shim 同步）");
                            ((CoreWebView2)sender).PostWebMessageAsString("{\"h4sSaved\":true}");
                        }
                        catch (Exception ex)
                        {
                            Program.Log("[A] 写回失败: " + ex.Message);
                            ((CoreWebView2)sender).PostWebMessageAsString("{\"h4sSaved\":false,\"reason\":\"" + ex.Message.Replace("\"", "'") + "\"}");
                        }
                    }
                    break;
                case "theme": /* 播放器深浅色切换 → 标题栏同步配色 */
                    if (root.TryGetProperty("data", out var th))
                    {
                        Program.Log("[A] theme 消息: " + th.GetString());
                        UpdateChromeTheme(th.GetString() == "light");
                    }
                    break;
            }
        }
        catch { }
    }

    private void UpdateTitles()
    {
        string doc = _wv.CoreWebView2.DocumentTitle;
        Text = doc + " — html4s 播放器";
        _titleLabel.Text = doc + (_playerOk ? "  ✓ 播放器已接管" : "");
    }

    /* 浅色/深色 → 标题栏配色（面板、应用名、文档标题、三个窗口按钮） */
    private void UpdateChromeTheme(bool light)
    {
        Program.Log("[A] UpdateChromeTheme light=" + light);
        BackColor = light ? Color.FromArgb(248, 250, 252) : Color.FromArgb(13, 17, 23);
        _titleBar.BackColor = BackColor;
        _appLabel.ForeColor = light ? Color.FromArgb(3, 105, 161) : Color.FromArgb(125, 211, 252);
        _titleLabel.ForeColor = light ? Color.FromArgb(100, 116, 139) : Color.FromArgb(148, 163, 184);
        foreach (var b in _capBtns) b.SetTheme(light);
    }

    private async Task DiagnosePlayerLoad(CoreWebView2 core)
    {
        try
        {
            await Task.Delay(5000);
            /* 接管判定看 body 类（window.H4S 在脚本加载即存在，不代表接管成功） */
            string r = await core.ExecuteScriptAsync(
                "document.body.classList.contains('h4s-live') || document.body.classList.contains('h4s-browse')");
            _playerOk = (r == "true");
            UpdateTitles();
            if (!_playerOk)
                _titleLabel.Text += "  ✗ 播放器未加载";
            /* 兜底：若握手主题消息未到达（旧版播放器），按 body 属性对齐标题栏 */
            string th = await core.ExecuteScriptAsync("document.body.getAttribute('data-ui')||'dark'");
            UpdateChromeTheme(th == "\"light\"");
            /* kiosk 诊断：确认 hash 与播放器模式 */
            string diag = await core.ExecuteScriptAsync(
                "JSON.stringify({hash:location.hash,live:document.body.classList.contains('h4s-live'),kiosk:document.body.classList.contains('h4s-kiosk')})");
            Program.Log("[A] kiosk diag: " + diag);
            /* 普通 HTML 兼容：页面无播放器且无幻灯片结构 → 注入播放器（安装包 player/ 内嵌源），
               播放器 boot 检测 S.n=0 → 启用"网页放映模式"（F5 全屏按屏翻页） */
            if (!_playerOk && !_kiosk)
            {
                var noPlayer = await core.ExecuteScriptAsync(
                    "(typeof window.H4S==='undefined' && !document.querySelector('h4s-deck,h4s-slide,.slides'))");
                Program.Log("[A] noPlayer 查询: " + noPlayer + " · kiosk=" + _kiosk + " · playerOk=" + _playerOk);
                if (noPlayer == "true")
                {
                    /* player 源定位：安装布局（{app}\Player → {app}\player）与源码树（bin 三层上）都尝试 */
                    var playerSrc = new[] {
                        Path.Combine(AppContext.BaseDirectory, "..", "player", "h4s.player.js"),
                        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "player", "h4s.player.js"),
                    }.FirstOrDefault(File.Exists);
                    if (playerSrc != null)
                    {
                        var src = File.ReadAllText(playerSrc);
                        await core.ExecuteScriptAsync(src);
                        Program.Log("[A] 普通 HTML：已注入播放器（网页放映模式，源=" + playerSrc + "）");
                    }
                    else Program.Log("[A] 普通 HTML 未接管但未找到 player 源（跳过注入）");
                }
            }
        }
        catch { }
    }

    private void OnNewWindow(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        // 演讲者双窗口：同进程第二个 WebView2，共享同一 Environment
        // （同用户数据目录 + 同虚拟主机 = 同源，BroadcastChannel 互通）
        e.Handled = true;
        float sc = Program.DpiScale(this); /* 高 DPI 屏：窗口尺寸同步缩放（WebView 内容自适应，无需裁切风险） */
        var presenter = new StageWindow(e.Uri, kiosk: false)
        {
            Text = "演讲者视图",
            Size = new Size((int)(1100 * sc), (int)(720 * sc)),
            WindowState = FormWindowState.Normal,
            StartPosition = FormStartPosition.Manual
        };

        /* 双屏时自动把演讲者窗放副屏 */
        var screens = Screen.AllScreens;
        if (screens.Length > 1)
        {
            var stageScreen = Screen.FromControl(this);
            foreach (var s in screens)
            {
                if (s.DeviceName != stageScreen.DeviceName)
                {
                    presenter.DesktopLocation = s.WorkingArea.Location;
                    presenter.WindowState = FormWindowState.Maximized;
                    break;
                }
            }
        }
        presenter.Show(this);
    }

    /* ---- 标题栏按钮：纯 GDI 自绘（无字体依赖），VS Code 风格悬停 ---- */
    private sealed class CaptionButton : Control
    {
        public enum Kind { Min, Max, Restore, Close }
        public Kind K;
        public Color HoverBack = Color.FromArgb(30, 41, 59);
        public Color HoverFore = Color.FromArgb(226, 232, 240);
        private bool _hover;
        private Color _bar = Color.FromArgb(13, 17, 23);
        private Color _fore = Color.FromArgb(148, 163, 184);

        public CaptionButton(Kind k, string tip)
        {
            K = k;
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint
                | ControlStyles.Opaque | ControlStyles.DoubleBuffer | ControlStyles.ResizeRedraw, true);
            TabStop = false;
            var t = new ToolTip();
            t.SetToolTip(this, tip);
            MouseEnter += (_, _) => { _hover = true; Invalidate(); };
            MouseLeave += (_, _) => { _hover = false; Invalidate(); };
        }

        /* 跟随播放器深浅色切换调色板；关闭键悬停红/白保持不变 */
        public void SetTheme(bool light)
        {
            _bar = light ? Color.FromArgb(248, 250, 252) : Color.FromArgb(13, 17, 23);
            _fore = light ? Color.FromArgb(51, 65, 85) : Color.FromArgb(148, 163, 184);
            HoverBack = light ? Color.FromArgb(221, 229, 238) : Color.FromArgb(30, 41, 59);
            HoverFore = light ? Color.FromArgb(15, 23, 42) : Color.FromArgb(226, 232, 240);
            if (K == Kind.Close)
            {
                HoverBack = Color.FromArgb(232, 17, 35);
                HoverFore = Color.White;
            }
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            var g = e.Graphics;
            bool closeK = K == Kind.Close;
            g.Clear(_hover ? (closeK ? Color.FromArgb(232, 17, 35) : HoverBack) : _bar);
            var c = _hover ? (closeK ? Color.White : HoverFore) : _fore;
            int w = Width, h = Height, cx = w / 2, cy = h / 2;

            using var p = new Pen(c, 1f);
            switch (K)
            {
                case Kind.Min:
                    g.DrawLine(p, cx - 5, cy, cx + 5, cy);
                    break;
                case Kind.Max:
                    g.DrawRectangle(p, cx - 5, cy - 5, 10, 10);
                    break;
                case Kind.Restore:
                    g.DrawRectangle(p, cx - 3, cy - 6, 8, 8);
                    g.DrawRectangle(p, cx - 6, cy - 3, 8, 8);
                    break;
                case Kind.Close:
                    g.DrawLine(p, cx - 5, cy - 5, cx + 5, cy + 5);
                    g.DrawLine(p, cx + 5, cy - 5, cx - 5, cy + 5);
                    break;
            }
        }
    }
}
