@echo off
rem Test runner for the KDXF written exam problems.
rem Usage: run_tests.bat [q1|q2|q3|all] [path\to\solution.cpp]
rem   Examples:
rem     run_tests.bat q1 my_q1.cpp
rem     run_tests.bat all my_all_in_one.cpp
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_tests.ps1" %*
exit /b %ERRORLEVEL%
