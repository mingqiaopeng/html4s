/* 生成 release/html4s-0.3 的 install.bat / uninstall.bat（含桌面+开始菜单快捷方式） */
import fs from 'node:fs';

const dir = 'D:/MyProjects/Html4s/release/html4s-0.3';

const install = `@echo off
rem ============================================================
rem html4s 0.3 安装脚本（当前用户级，无需管理员）
rem - 复制播放器到 %LOCALAPPDATA%\\Html4s\\Player
rem - 注册 .html4s 双击关联
rem - 创建桌面快捷方式 + 开始菜单项
rem - uninstall.bat 可全部撤销
rem ============================================================
chcp 65001 >nul
setlocal
set "PKG=%~dp0"
set "DEST=%LOCALAPPDATA%\\Html4s"
set "EXE=%DEST%\\Player\\Html4sPlayer.exe"

echo [1/4] 复制播放器到 %DEST%\\Player ...
xcopy /e /i /y /q "%PKG%Html4sPlayer" "%DEST%\\Player\\" >nul
if errorlevel 1 goto :fail

echo [2/4] 注册 .html4s 文件关联 ...
reg add HKCU\\Software\\Classes\\.html4s /ve /d "html4s.deck" /f >nul
reg add HKCU\\Software\\Classes\\html4s.deck /ve /d "html4s 演示文稿" /f >nul
reg add HKCU\\Software\\Classes\\html4s.deck\\DefaultIcon /ve /d "%EXE%,0" /f >nul
reg add HKCU\\Software\\Classes\\html4s.deck\\shell\\open\\command /ve /d "\\"%EXE%\\" \\"%%1\\"" /f >nul
if errorlevel 1 goto :fail

echo [3/4] 创建快捷方式 ...
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$d = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\html4s 播放器.lnk');" ^
  "$d.TargetPath = '%EXE%'; $d.Description = 'html4s 演示文稿播放器'; $d.Save();" ^
  "$sm = [Environment]::GetFolderPath('StartMenu') + '\\Programs\\html4s';" ^
  "New-Item -ItemType Directory -Force -Path $sm | Out-Null;" ^
  "$s = $ws.CreateShortcut($sm + '\\html4s 播放器.lnk');" ^
  "$s.TargetPath = '%EXE%'; $s.Description = 'html4s 演示文稿播放器'; $s.Save();" ^
  "$s2 = $ws.CreateShortcut($sm + '\\卸载 html4s.lnk');" ^
  "$s2.TargetPath = '%DEST%\\uninstall.bat'; $s2.Description = '撤销 html4s 文件关联并移除播放器'; $s2.Save()"
if errorlevel 1 echo   （快捷方式创建失败——不影响播放器与文件关联，可忽略）

echo [4/4] 复制卸载脚本 ...
copy /y "%PKG%uninstall.bat" "%DEST%\\uninstall.bat" >nul

echo.
echo   完成。双击任意 .html4s 文件即可放映；
echo   或从 开始菜单 / 桌面 启动 html4s 播放器。
echo   快捷键：Ctrl+O 打开文件 · Ctrl+L 网址 · Ctrl+R 最近打开 · F5 放映 · F11 全屏
echo   创作请使用包内 skill/ 与 tools/（配合 AI Agent，MCP 注册见 docs/）。
echo.
pause
exit /b 0

:fail
echo 安装失败，请检查权限后重试。
pause
exit /b 1
`;

const uninstall = `@echo off
rem ============================================================
rem html4s 卸载脚本：撤销文件关联 + 移除快捷方式 + 删除播放器副本
rem （保留 %LOCALAPPDATA%\\Html4s 下的用户数据：最近打开记录）
rem ============================================================
chcp 65001 >nul
setlocal
set "DEST=%LOCALAPPDATA%\\Html4s"

echo 撤销 .html4s 文件关联 ...
reg delete HKCU\\Software\\Classes\\.html4s /f >nul 2>&1
reg delete HKCU\\Software\\Classes\\html4s.deck /f >nul 2>&1

echo 移除开始菜单与桌面快捷方式 ...
powershell -NoProfile -Command ^
  "$sm = [Environment]::GetFolderPath('StartMenu') + '\\Programs\\html4s';" ^
  "if (Test-Path $sm) { Remove-Item -Recurse -Force $sm };" ^
  "$d = [Environment]::GetFolderPath('Desktop') + '\\html4s 播放器.lnk';" ^
  "if (Test-Path $d) { Remove-Item -Force $d }"

echo 移除播放器副本 ...
if exist "%DEST%\\Player" rd /s /q "%DEST%\\Player"
if exist "%DEST%\\uninstall.bat" del /q "%DEST%\\uninstall.bat"

echo.
echo 已卸载（最近打开记录保留于 %DEST%，可手动删除整个目录）。
pause
`;

fs.writeFileSync(dir + '/install.bat', install, 'utf8');
fs.writeFileSync(dir + '/uninstall.bat', uninstall, 'utf8');
console.log('installers written');
