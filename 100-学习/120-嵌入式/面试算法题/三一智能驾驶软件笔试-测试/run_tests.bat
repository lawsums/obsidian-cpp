@echo off
rem Generic exam test runner: auto-discovers qN-* folders and tests qN.cpp.
rem Usage:
rem   run_tests.bat                 - test all problems (looks for qN.cpp)
rem   run_tests.bat -Problem q1     - test q1 only
rem   run_tests.bat -Source a.cpp   - test all problems with one source file
rem   run_tests.bat -Reference      - self-check using reference\qN.cpp
rem   run_tests.bat -List           - list discovered problems
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_tests.ps1" %*
exit /b %ERRORLEVEL%
