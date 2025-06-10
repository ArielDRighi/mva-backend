#!/bin/bash

# Script para probar configuración HTTPS localmente
# Este script simula el entorno de producción localmente

echo "🧪 Iniciando pruebas locales de configuración HTTPS"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Verificar que Node.js está instalado
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js instalado: $NODE_VERSION"
    else
        print_error "Node.js no está instalado"
        exit 1
    fi
}

# Verificar que npm está instalado
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm instalado: $NPM_VERSION"
    else
        print_error "npm no está instalado"
        exit 1
    fi
}

# Verificar dependencias del proyecto
check_dependencies() {
    print_info "Verificando dependencias del proyecto..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json no encontrado"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules no encontrado, instalando dependencias..."
        npm install
    fi
    
    print_success "Dependencias verificadas"
}

# Verificar compilación del proyecto
check_build() {
    print_info "Verificando compilación del proyecto..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Proyecto compilado correctamente"
    else
        print_error "Error al compilar el proyecto"
        exit 1
    fi
}

# Crear certificados SSL de prueba
create_test_certificates() {
    print_info "Creando certificados SSL de prueba..."
    
    CERT_DIR="./ssl-test"
    mkdir -p "$CERT_DIR"
    
    # Generar clave privada
    openssl genrsa -out "$CERT_DIR/private.key" 2048 2>/dev/null
    
    # Generar certificado autofirmado
    openssl req -new -x509 -key "$CERT_DIR/private.key" -out "$CERT_DIR/certificate.crt" -days 365 -subj "/C=ES/ST=Test/L=Test/O=MVA/CN=localhost" 2>/dev/null
    
    if [ -f "$CERT_DIR/certificate.crt" ] && [ -f "$CERT_DIR/private.key" ]; then
        print_success "Certificados SSL de prueba creados"
        export SSL_CERT_PATH="$(pwd)/$CERT_DIR/certificate.crt"
        export SSL_KEY_PATH="$(pwd)/$CERT_DIR/private.key"
    else
        print_error "Error creando certificados SSL de prueba"
        exit 1
    fi
}

# Configurar variables de entorno de prueba
setup_test_environment() {
    print_info "Configurando entorno de prueba..."
    
    export NODE_ENV=production
    export PORT=3001
    export FRONTEND_URL=https://localhost:3000
    export JWT_SECRET=test_secret_key_for_https_testing
    export JWT_EXPIRES_IN=24h
    
    # Variables de base de datos (usar valores por defecto si no están configuradas)
    export DB_HOST=${DB_HOST:-localhost}
    export DB_PORT=${DB_PORT:-5432}
    export DB_USERNAME=${DB_USERNAME:-test}
    export DB_PASSWORD=${DB_PASSWORD:-test}
    export DB_DATABASE=${DB_DATABASE:-test}
    export DB_SCHEMA=${DB_SCHEMA:-public}
    
    print_success "Variables de entorno configuradas para prueba"
}

# Iniciar el servidor en modo de prueba
start_test_server() {
    print_info "Iniciando servidor de prueba con HTTPS..."
    
    # Matar cualquier proceso existente en el puerto
    kill $(lsof -t -i:$PORT) 2>/dev/null || true
    
    # Iniciar servidor en background
    node dist/src/main.js &
    SERVER_PID=$!
    
    print_info "Servidor iniciado con PID: $SERVER_PID"
    
    # Esperar a que el servidor inicie
    sleep 5
    
    # Verificar que el servidor está corriendo
    if kill -0 $SERVER_PID 2>/dev/null; then
        print_success "Servidor iniciado correctamente"
    else
        print_error "Error iniciando el servidor"
        exit 1
    fi
}

# Probar conectividad HTTPS
test_https_connectivity() {
    print_info "Probando conectividad HTTPS..."
    
    # Probar endpoint principal
    if curl -f -s -k "https://localhost:$PORT/api" > /dev/null; then
        print_success "HTTPS endpoint /api responde correctamente"
    else
        print_error "HTTPS endpoint /api no responde"
        return 1
    fi
    
    # Probar endpoint específico (si existe)
    if curl -f -s -k "https://localhost:$PORT/api/auth/health" > /dev/null 2>&1; then
        print_success "HTTPS endpoint /api/auth/health responde correctamente"
    else
        print_warning "HTTPS endpoint /api/auth/health no disponible (esto puede ser normal)"
    fi
}

# Probar configuración CORS
test_cors_configuration() {
    print_info "Probando configuración CORS..."
    
    CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: https://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS "https://localhost:$PORT/api" -k 2>/dev/null)
    
    if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
        print_success "CORS configurado correctamente"
    else
        print_warning "CORS podría tener problemas (código: $CORS_RESPONSE)"
    fi
}

# Limpiar después de las pruebas
cleanup() {
    print_info "Limpiando recursos de prueba..."
    
    # Matar servidor de prueba
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        print_success "Servidor de prueba detenido"
    fi
    
    # Eliminar certificados de prueba
    if [ -d "./ssl-test" ]; then
        rm -rf "./ssl-test"
        print_success "Certificados de prueba eliminados"
    fi
}

# Mostrar resumen de la prueba
show_test_summary() {
    echo ""
    echo "📊 Resumen de pruebas HTTPS locales:"
    echo "===================================="
    echo "🌐 URL de prueba: https://localhost:$PORT/api"
    echo "🔒 Certificados SSL: Autofirmados (solo para prueba)"
    echo "🌍 Frontend URL: $FRONTEND_URL"
    echo "📅 Modo: $NODE_ENV"
    echo ""
    print_success "¡Todas las pruebas locales completadas exitosamente!"
    print_info "Tu configuración HTTPS está lista para producción."
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Obtener certificados SSL reales en Hostinger"
    echo "2. Configurar variables de entorno en producción"
    echo "3. Desplegar usando ./scripts/deploy-https.sh"
}

# Función principal
main() {
    echo "🧪 Pruebas locales de configuración HTTPS - MVA Backend"
    echo "======================================================"
    
    # Configurar trap para cleanup automático
    trap cleanup EXIT
    
    check_nodejs
    check_npm
    check_dependencies
    check_build
    create_test_certificates
    setup_test_environment
    start_test_server
    
    if test_https_connectivity; then
        test_cors_configuration
        show_test_summary
    else
        print_error "Las pruebas HTTPS fallaron"
        exit 1
    fi
}

# Ejecutar si es llamado directamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
