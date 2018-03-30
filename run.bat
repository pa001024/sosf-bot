@echo off

:top

cmd /c ts-node ./lib/index.ts
echo restarting.
ping ::1 /n 1 >nul
echo .
ping ::1 /n 1 >nul
echo .
ping ::1 /n 1 >nul

goto top

:end
