@echo off
cd %~dp0

setlocal enabledelayedexpansion

REM Define the length of the random hex string
set "hex_length=128"

REM Initialize the hex characters
set "hex_chars=0123456789abcdef"

REM Variable to store the random hex string
set "random_hex="

REM Loop until the required length is reached
for /L %%i in (1,1,%hex_length%) do (
    REM Generate a random number between 0 and 15
    set /a "rand=((!random! * !random! + !random! %% 281 * %%i) + !time:~-2!) %% 16"
    rem echo !rand!

    REM Get the hex character from hex_chars based on the random number
    for %%r in (!rand!) do set "random_hex=!random_hex!!hex_chars:~%%r,1!"
)

if not exist "config.py" (
    echo #!/bin/env python3 > config.py
    echo SECRET_KEY = "%random_hex%" >> config.py
)


if not exist "venv/Scripts/activate.bat" (
    python3.exe -m venv venv
)

call venv/Scripts/activate.bat
python3 -m pip install -r requirements.txt

python3 server.py

endlocal
