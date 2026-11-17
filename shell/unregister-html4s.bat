@echo off
rem 撤销 .html4s 文件关联
reg delete HKCU\Software\Classes\.html4s /f
reg delete HKCU\Software\Classes\html4s.deck /f
echo 已取消 .html4s 关联
pause
