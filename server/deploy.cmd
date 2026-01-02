@echo off

:: Azure Web App Deployment Script for Node.js

:: Deployment
:: ----------

echo Deploying Cricket Expense App to Azure...

:: 1. Select node version
call :SelectNodeVersion

:: 2. Install npm packages
IF EXIST "%DEPLOYMENT_TARGET%\package.json" (
  pushd "%DEPLOYMENT_TARGET%"
  echo Installing npm packages...
  call npm install --production
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: Post deployment
:: --------------

echo Deployment complete!

goto end

:: Execute command routine
:ExecuteCmd
setlocal
set _CMD_=%*
call %_CMD_%
if "%ERRORLEVEL%" NEQ "0" echo Failed exitCode=%ERRORLEVEL%, command=%_CMD_%
exit /b %ERRORLEVEL%

:error
endlocal
echo An error has occurred during deployment.
call :exitSetErrorLevel
call :exitFromFunction 2>nul

:exitSetErrorLevel
exit /b 1

:exitFromFunction
()

:end
endlocal
echo Finished successfully.

:SelectNodeVersion
IF DEFINED KUDU_SELECT_NODE_VERSION_CMD (
  call %KUDU_SELECT_NODE_VERSION_CMD% "%DEPLOYMENT_SOURCE%" "%DEPLOYMENT_TARGET%" "%DEPLOYMENT_TEMP%"
  IF !ERRORLEVEL! NEQ 0 goto error
)

IF EXIST "%DEPLOYMENT_TEMP%\__nodeVersion.tmp" (
  SET /p NODE_EXE=<"%DEPLOYMENT_TEMP%\__nodeVersion.tmp"
  IF !ERRORLEVEL! NEQ 0 goto error
)

IF EXIST "%DEPLOYMENT_TEMP%\__npmVersion.tmp" (
  SET /p NPM_JS_PATH=<"%DEPLOYMENT_TEMP%\__npmVersion.tmp"
  IF !ERRORLEVEL! NEQ 0 goto error
)

IF NOT DEFINED NODE_EXE (
  SET NODE_EXE=node
)

goto :EOF
