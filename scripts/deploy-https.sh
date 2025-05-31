#!/bin/bash

# Script de despliegue HTTPS para Hostinger
# Coloca este script en tu servidor de Hostinger

set -e

echo "🚀 Iniciando despliegue del backend MVA con HTTPS..."

# Variables
PROJECT_DIR="/path/to/your/project"  # Cambiar por la ruta real en Hostinger
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Función para verificar certificados SSL
check_ssl_certificates() {
    echo "🔐 Verificando certificados SSL..."
    
    if [ ! -f "$SSL_CERT_PATH" ]; then
        echo "❌ Error: No se encontró el certificado SSL en $SSL_CERT_PATH"
        exit 1
    fi
    
    if [ ! -f "$SSL_KEY_PATH" ]; then
        echo "❌ Error: No se encontró la clave privada SSL en $SSL_KEY_PATH"
        exit 1
    fi
    
    echo "✅ Certificados SSL encontrados correctamente"
}

# Función para hacer backup
make_backup() {
    echo "📦 Creando backup..."
    tar -czf "$BACKUP_DIR/mva-backend-backup-$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" .
    echo "✅ Backup creado: mva-backend-backup-$TIMESTAMP.tar.gz"
}

# Función para instalar dependencias
install_dependencies() {
    echo "📥 Instalando dependencias..."
    cd "$PROJECT_DIR"
    npm ci --production
    echo "✅ Dependencias instaladas"
}

# Función para compilar el proyecto
build_project() {
    echo "🔨 Compilando el proyecto..."
    cd "$PROJECT_DIR"
    npm run build
    echo "✅ Proyecto compilado"
}

# Función para reiniciar el servicio
restart_service() {
    echo "🔄 Reiniciando el servicio..."
    
    # Si usas PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart mva-backend || pm2 start dist/src/main.js --name mva-backend
    # Si usas systemd
    elif command -v systemctl &> /dev/null; then
        sudo systemctl restart mva-backend
    # Si usas un script personalizado
    else
        # Matar proceso existente
        pkill -f "node.*main.js" || true
        # Iniciar nuevo proceso en background
        nohup node dist/src/main.js > /dev/null 2>&1 &
    fi
    
    echo "✅ Servicio reiniciado"
}

# Función para verificar que el servicio esté funcionando
check_service() {
    echo "🔍 Verificando que el servicio esté funcionando..."
    
    sleep 5  # Esperar un poco para que el servicio inicie
    
    # Verificar puerto HTTP/HTTPS
    if command -v curl &> /dev/null; then
        if curl -f -s "http://localhost:$PORT/api" > /dev/null; then
            echo "✅ Servicio HTTP funcionando correctamente"
        elif curl -f -s -k "https://localhost:$PORT/api" > /dev/null; then
            echo "✅ Servicio HTTPS funcionando correctamente"
        else
            echo "❌ Error: El servicio no responde"
            exit 1
        fi
    else
        echo "⚠️  curl no disponible, no se puede verificar el servicio automáticamente"
    fi
}

# Función principal
main() {
    echo "🌟 Iniciando despliegue..."
    
    # Cargar variables de entorno
    if [ -f "$PROJECT_DIR/.env" ]; then
        export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
    fi
    
    # Verificar certificados SSL si estamos en producción
    if [ "$NODE_ENV" = "production" ]; then
        check_ssl_certificates
    fi
    
    make_backup
    install_dependencies
    build_project
    restart_service
    check_service
    
    echo "🎉 ¡Despliegue completado exitosamente!"
    echo "🌐 Tu API está disponible en:"
    if [ "$NODE_ENV" = "production" ]; then
        echo "   HTTPS: https://tu-dominio.com/api"
    else
        echo "   HTTP: http://tu-dominio.com/api"
    fi
}

# Ejecutar función principal
main "$@"
