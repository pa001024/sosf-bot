@echo off

:top

cmd /c babel-node ./lib/index.js
echo restarting...
ping ::1 /n 3 >nul

goto top

:end
