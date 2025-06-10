#!/bin/bash

# Script para verificar configuración HTTPS
# Uso: ./scripts/verify-https.sh [domain]

DOMAIN=${1:-"localhost"}
PORT=${2:-"3000"}

echo "🔍 Verificando configuración HTTPS para $DOMAIN:$PORT"

# Función para verificar certificados locales
check_local_certificates() {
    echo "📋 Verificando certificados SSL locales..."
    
    if [ -n "$SSL_CERT_PATH" ] && [ -f "$SSL_CERT_PATH" ]; then
        echo "✅ Certificado encontrado: $SSL_CERT_PATH"
        
        # Verificar información del certificado
        echo "📄 Información del certificado:"
        openssl x509 -in "$SSL_CERT_PATH" -text -noout | grep -E "(Subject:|Not After :|Not Before :)"
        
        # Verificar si el certificado está cerca de expirar
        EXPIRY_DATE=$(openssl x509 -in "$SSL_CERT_PATH" -noout -enddate | cut -d= -f2)
        EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_TIMESTAMP=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            echo "⚠️  Advertencia: El certificado expira en $DAYS_UNTIL_EXPIRY días"
        else
            echo "✅ Certificado válido por $DAYS_UNTIL_EXPIRY días más"
        fi
    else
        echo "❌ Certificado no encontrado en: $SSL_CERT_PATH"
    fi
    
    if [ -n "$SSL_KEY_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
        echo "✅ Clave privada encontrada: $SSL_KEY_PATH"
    else
        echo "❌ Clave privada no encontrada en: $SSL_KEY_PATH"
    fi
}

# Función para verificar conectividad HTTPS
check_https_connectivity() {
    echo "🌐 Verificando conectividad HTTPS..."
    
    # Verificar HTTPS
    if curl -f -s -k "https://$DOMAIN:$PORT/api" > /dev/null 2>&1; then
        echo "✅ HTTPS funcionando en https://$DOMAIN:$PORT/api"
        
        # Obtener información del certificado remoto
        echo "📄 Información del certificado remoto:"
        echo | openssl s_client -connect "$DOMAIN:$PORT" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -subject -dates
    else
        echo "❌ HTTPS no funciona en https://$DOMAIN:$PORT/api"
    fi
    
    # Verificar HTTP (para ver si hay redirección)
    if curl -f -s "http://$DOMAIN:$PORT/api" > /dev/null 2>&1; then
        echo "⚠️  HTTP aún funciona en http://$DOMAIN:$PORT/api"
        echo "   Considera configurar redirección automática a HTTPS"
    else
        echo "✅ HTTP no responde (esto es bueno si tienes redirección configurada)"
    fi
}

# Función para verificar configuración de CORS
check_cors_configuration() {
    echo "🔗 Verificando configuración CORS..."
    
    if [ -n "$FRONTEND_URL" ]; then
        echo "✅ FRONTEND_URL configurada: $FRONTEND_URL"
        
        # Verificar si el frontend puede conectarse
        CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Origin: $FRONTEND_URL" \
            -H "Access-Control-Request-Method: GET" \
            -H "Access-Control-Request-Headers: Content-Type" \
            -X OPTIONS "https://$DOMAIN:$PORT/api" 2>/dev/null)
        
        if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
            echo "✅ CORS configurado correctamente para $FRONTEND_URL"
        else
            echo "⚠️  CORS podría tener problemas (código: $CORS_RESPONSE)"
        fi
    else
        echo "⚠️  FRONTEND_URL no está configurada"
    fi
}

# Función para verificar variables de entorno
check_environment_variables() {
    echo "⚙️  Verificando variables de entorno..."
    
    REQUIRED_VARS=("NODE_ENV" "PORT")
    HTTPS_VARS=("SSL_CERT_PATH" "SSL_KEY_PATH")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -n "${!var}" ]; then
            echo "✅ $var: ${!var}"
        else
            echo "❌ $var: no configurada"
        fi
    done
    
    if [ "$NODE_ENV" = "production" ]; then
        for var in "${HTTPS_VARS[@]}"; do
            if [ -n "${!var}" ]; then
                echo "✅ $var: ${!var}"
            else
                echo "❌ $var: no configurada (requerida en producción)"
            fi
        done
    fi
}

# Función para verificar puertos
check_ports() {
    echo "🔌 Verificando puertos..."
    
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
        echo "✅ Puerto $PORT está en uso"
        netstat -tlnp 2>/dev/null | grep ":$PORT "
    else
        echo "❌ Puerto $PORT no está en uso"
    fi
}

# Función para mostrar resumen
show_summary() {
    echo ""
    echo "📊 Resumen de la verificación:"
    echo "================================"
    echo "🌐 Dominio: $DOMAIN"
    echo "🔌 Puerto: $PORT"
    echo "🔒 HTTPS: $(curl -f -s -k "https://$DOMAIN:$PORT/api" > /dev/null 2>&1 && echo "✅ Funcionando" || echo "❌ No funciona")"
    echo "🌍 Frontend URL: ${FRONTEND_URL:-"No configurada"}"
    echo "📅 Modo: ${NODE_ENV:-"No especificado"}"
    
    if [ "$NODE_ENV" = "production" ]; then
        echo "🔐 Certificado SSL: $([ -f "$SSL_CERT_PATH" ] && echo "✅ Encontrado" || echo "❌ No encontrado")"
        echo "🔑 Clave privada: $([ -f "$SSL_KEY_PATH" ] && echo "✅ Encontrada" || echo "❌ No encontrada")"
    fi
}

# Función principal
main() {
    echo "🚀 Iniciando verificación HTTPS para MVA Backend"
    echo "================================================="
    
    # Cargar variables de entorno si existe el archivo .env
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs) 2>/dev/null
        echo "✅ Variables de entorno cargadas desde .env"
    fi
    
    check_environment_variables
    echo ""
    
    if [ "$NODE_ENV" = "production" ]; then
        check_local_certificates
        echo ""
    fi
    
    check_ports
    echo ""
    
    check_https_connectivity
    echo ""
    
    check_cors_configuration
    echo ""
    
    show_summary
    
    echo ""
    echo "🎉 Verificación completada"
}

# Mostrar ayuda
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [dominio] [puerto]"
    echo ""
    echo "Ejemplos:"
    echo "  $0                          # Verificar localhost:3000"
    echo "  $0 mi-dominio.com          # Verificar mi-dominio.com:3000"
    echo "  $0 mi-dominio.com 443      # Verificar mi-dominio.com:443"
    echo ""
    echo "El script verifica:"
    echo "  - Variables de entorno"
    echo "  - Certificados SSL"
    echo "  - Conectividad HTTPS"
    echo "  - Configuración CORS"
    echo "  - Puertos en uso"
    exit 0
fi

# Ejecutar verificación
main "$@"
