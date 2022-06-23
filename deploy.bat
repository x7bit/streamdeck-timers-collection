@echo off
SET BUILD_DIR="release"
SET BUILD_FILE="%BUILD_DIR%\com.rayco.workdaytimer.streamDeckPlugin"
SET SOURCE_DIR="src\com.rayco.workdaytimer.sdPlugin"
IF EXIST %BUILD_FILE% DEL /F %BUILD_FILE%
.\DistributionTool.exe -b -i %SOURCE_DIR% -o %BUILD_DIR%