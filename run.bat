@echo off

:top

cmd /c ts-node ./lib/index.ts
echo restarting.
ping ::1 /n 2 >nul
echo restarting..
ping ::1 /n 2 >nul
echo restarting...
ping ::1 /n 2 >nul

goto top

:end
