# Regla de Sincronización Automática con GitHub

## Objetivo
Cada vez que se realice un cambio, adición, corrección o nueva funcionalidad en el código del proyecto, el agente debe:
1. Verificar que el código compile y pase las pruebas.
2. Hacer `git add .` excluyendo archivos ignorados (`.env`, `node_modules`, `dev.db`, etc.).
3. Crear un commit semántico y descriptivo (ej. `feat:...`, `fix:...`, `chore:...`).
4. Hacer `git push origin main` al repositorio `https://github.com/Franksalcedo-prog/socialcount-analytics`.

## Ruta del binario de Git
Utilizar el ejecutable de Git instalado:
`C:\Users\Frank\AppData\Local\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe`

## Credenciales y Seguridad
- Nunca registrar credenciales ni secretos reales en el repositorio.
- El archivo `.gitignore` debe proteger estrictamente `.env`, archivos de bases de datos locales y dependencias.
