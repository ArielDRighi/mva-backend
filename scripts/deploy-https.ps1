# Script de despliegue HTTPS para Windows PowerShell
# Uso: .\scripts\deploy-https.ps1

param(
    [string]$ProjectPath = "C:\path\to\your\project",
    [string]$BackupPath = "C:\path\to\backups"
)

Write-Host "🚀 Iniciando despliegue del backend MVA con HTTPS..." -ForegroundColor Green

# Variables
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupPath\mva-backend-backup-$Timestamp.zip"

# Crear directorio de backup si no existe
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
}

# Función para verificar certificados SSL
function Test-SSLCertificates {
    Write-Host "🔐 Verificando certificados SSL..." -ForegroundColor Yellow
    
    $certPath = $env:SSL_CERT_PATH
    $keyPath = $env:SSL_KEY_PATH
    
    if (!(Test-Path $certPath)) {
        Write-Host "❌ Error: No se encontró el certificado SSL en $certPath" -ForegroundColor Red
        exit 1
    }
    
    if (!(Test-Path $keyPath)) {
        Write-Host "❌ Error: No se encontró la clave privada SSL en $keyPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Certificados SSL encontrados correctamente" -ForegroundColor Green
}

# Función para hacer backup
function New-Backup {
    Write-Host "📦 Creando backup..." -ForegroundColor Yellow
    
    try {
        Compress-Archive -Path "$ProjectPath\*" -DestinationPath $BackupFile -Force
        Write-Host "✅ Backup creado: $BackupFile" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error creando backup: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Función para instalar dependencias
function Install-Dependencies {
    Write-Host "📥 Instalando dependencias..." -ForegroundColor Yellow
    
    Set-Location $ProjectPath
    npm ci --production
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
}

# Función para compilar el proyecto
function Build-Project {
    Write-Host "🔨 Compilando el proyecto..." -ForegroundColor Yellow
    
    Set-Location $ProjectPath
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error compilando el proyecto" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Proyecto compilado" -ForegroundColor Green
}

# Función para reiniciar el servicio
function Restart-Service {
    Write-Host "🔄 Reiniciando el servicio..." -ForegroundColor Yellow
    
    # Verificar si PM2 está disponible
    $pm2Available = Get-Command pm2 -ErrorAction SilentlyContinue
    
    if ($pm2Available) {
        pm2 restart mva-backend
        if ($LASTEXITCODE -ne 0) {
            pm2 start dist\src\main.js --name mva-backend
        }
    }
    else {
        # Matar procesos Node.js existentes relacionados con el proyecto
        Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$ProjectPath*" } | Stop-Process -Force
        
        # Iniciar nuevo proceso
        Start-Process -FilePath "node" -ArgumentList "dist\src\main.js" -WorkingDirectory $ProjectPath -WindowStyle Hidden
    }
    
    Write-Host "✅ Servicio reiniciado" -ForegroundColor Green
}

# Función para verificar que el servicio esté funcionando
function Test-Service {
    Write-Host "🔍 Verificando que el servicio esté funcionando..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 5
    
    $port = $env:PORT
    if (!$port) { $port = "3000" }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/api" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Servicio HTTP funcionando correctamente" -ForegroundColor Green
        }
    }
    catch {
        try {
            $response = Invoke-WebRequest -Uri "https://localhost:$port/api" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Servicio HTTPS funcionando correctamente" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "❌ Error: El servicio no responde" -ForegroundColor Red
            Write-Host "Detalles: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}

# Función principal
function Main {
    Write-Host "🌟 Iniciando despliegue..." -ForegroundColor Cyan
    
    # Cargar variables de entorno
    $envFile = "$ProjectPath\.env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]*?)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
            }
        }
        Write-Host "✅ Variables de entorno cargadas" -ForegroundColor Green
    }
    
    # Verificar certificados SSL si estamos en producción
    if ($env:NODE_ENV -eq "production") {
        Test-SSLCertificates
    }
    
    New-Backup
    Install-Dependencies
    Build-Project
    Restart-Service
    Test-Service
    
    Write-Host "🎉 ¡Despliegue completado exitosamente!" -ForegroundColor Green
    Write-Host "🌐 Tu API está disponible en:" -ForegroundColor Cyan
    
    if ($env:NODE_ENV -eq "production") {
        Write-Host "   HTTPS: https://tu-dominio.com/api" -ForegroundColor White
    } else {
        Write-Host "   HTTP: http://tu-dominio.com/api" -ForegroundColor White
    }
}

# Ejecutar función principal
try {
    Main
}
catch {
    Write-Host "❌ Error durante el despliegue: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
