@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo ==========================================
echo       NEXUS OS - GESTAO DO SERVIDOR
echo ==========================================
echo [1] Iniciar Servidor (Dev)
echo [2] Parar/Pausar Servidor
echo [3] Reiniciar Servidor
echo [4] Sair
echo ==========================================
set /p opt="Escolha uma opcao: "

if "%opt%"=="1" goto START
if "%opt%"=="2" goto STOP
if "%opt%"=="3" goto RESTART
if "%opt%"=="4" goto EXIT
goto MENU

:START
echo Iniciando o servidor Nexus OS...
echo (Uma nova janela sera aberta com os logs do servidor)
:: Abrimos em uma nova janela para que o usuário possa ver o que esta acontecendo
start "SERVIDOR NEXUS OS" cmd /k "node node_modules\next\dist\bin\next dev"
echo Servidor disparado. Verifique a nova janela.
pause
goto MENU

:STOP
echo Parando o servidor na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Matando processo PID: %%a
    taskkill /F /PID %%a
)
echo Servidor parado com sucesso.
pause
goto MENU

:RESTART
call :STOP
timeout /t 2 /nobreak >nul
call :START
goto MENU

:EXIT
exit
