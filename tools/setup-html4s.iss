; html4s 播放器 0.3 安装包脚本（Inno Setup 6）
; 编译: ISCC.exe setup-html4s.iss  →  release/html4s-0.3.1-setup.exe
; 特性: 用户级安装（无需管理员）· .html4s 双击关联 · 桌面/开始菜单快捷方式
;       完成页可直接打开示例演示 · 卸载器自动清理关联与快捷方式

#define MyAppName "html4s 播放器"
#define MyAppVersion "0.6.0"
#define MyAppExeName "Player\Html4sPlayer.exe"
#define SrcDir "D:\MyProjects\Html4s\release\html4s-0.6.0"

[Setup]
AppId={{C4A91E77-6B2D-4F18-9E03-2A5C8D7B14F0}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher=HTML4S Project
DefaultDirName={localappdata}\Html4s
DefaultGroupName=html4s
PrivilegesRequired=lowest
OutputDir=D:\MyProjects\Html4s\release
OutputBaseFilename=html4s-0.6.0-setup
SetupIconFile=D:\MyProjects\Html4s\tools\html4s-app.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ChangesAssociations=yes
ShowLanguageDialog=no
VersionInfoVersion=0.3.1
VersionInfoDescription=html4s 播放器安装包
DisableProgramGroupPage=yes

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式(&D)"; \
  GroupDescription: "附加图标："; Flags: checkedonce

[Files]
; 播放器运行时（.NET 自包含 DLL 集）
Source: "{#SrcDir}\Html4sPlayer\*"; DestDir: "{app}\Player"; Flags: ignoreversion recursesubdirs createallsubdirs
; 播放器运行时源（供浏览器文档模式 / AI 工具引用）
Source: "{#SrcDir}\player\h4s.player.js"; DestDir: "{app}\player"; Flags: ignoreversion
; 示例 deck
Source: "{#SrcDir}\examples\*"; DestDir: "{app}\Examples"; Flags: ignoreversion recursesubdirs createallsubdirs
; AI 创作技能
Source: "{#SrcDir}\skill\*"; DestDir: "{app}\skill"; Flags: ignoreversion recursesubdirs createallsubdirs
; 工具链
Source: "{#SrcDir}\tools\*"; DestDir: "{app}\tools"; Flags: ignoreversion
; 文档
Source: "{#SrcDir}\docs\*"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "{#SrcDir}\LICENSES\*"; DestDir: "{app}\LICENSES"; Flags: ignoreversion
Source: "{#SrcDir}\ARCHITECTURE.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SrcDir}\README.md"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
; .html4s 双击关联（当前用户，卸载时自动撤销）
Root: HKCU; Subkey: "Software\Classes\.html4s"; ValueType: string; ValueData: "html4s.deck"; \
  Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\html4s.deck"; ValueType: string; ValueName: ""; ValueData: "html4s 演示文稿"; \
  Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\html4s.deck\DefaultIcon"; ValueType: string; ValueData: "{app}\{#MyAppExeName},0"; \
  Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\html4s.deck\shell\open\command"; ValueType: string; \
  ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Flags: uninsdeletekey

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{#MyAppName}（示例演示）"; Filename: "{app}\{#MyAppExeName}"; \
  Parameters: """{app}\Examples\fs-intro.html4s"""
Name: "{group}\{#MyAppName} 帮助"; Filename: "{app}\README.md"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: """{app}\Examples\fs-intro.html4s"""; \
  Description: "立即观看示例演示"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; 清理运行时生成的文件（WebView2 用户数据等）；保留 {app} 根下的 recent.txt 用户偏好
Type: filesandordirs; Name: "{app}\Player"
Type: filesandordirs; Name: "{app}\Examples"
