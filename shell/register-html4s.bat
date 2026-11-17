@echo off
rem 注册 .html4s 文件关联到 html4s 播放器（当前用户级别，可运行 unregister-html4s.bat 撤销）
set "EXE=%~dp0Html4sPlayer\bin\Release\net10.0-windows\Html4sPlayer.exe"

reg add HKCU\Software\Classes\.html4s /ve /d "html4s.deck" /f
reg add HKCU\Software\Classes\html4s.deck /ve /d "html4s 演示文稿" /f
reg add HKCU\Software\Classes\html4s.deck\DefaultIcon /ve /d "%EXE%,0" /f
reg add HKCU\Software\Classes\html4s.deck\shell\open\command /ve /d "\"%EXE%\" \"%%1\"" /f

echo 完成：.html4s 已关联到 Html4sPlayer
pause
