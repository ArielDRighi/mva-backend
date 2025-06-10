# 📚 Instrucciones de Deploy HTTPS - MVA Backend

Esta carpeta contiene toda la documentación necesaria para realizar el deploy del backend con configuración HTTPS en Hostinger.

## 📖 Archivos de Documentación

### [`HTTPS_MIGRATION.md`](./HTTPS_MIGRATION.md)

**Guía completa de migración a HTTPS**

- Pasos detallados para configurar SSL en Hostinger
- Configuración de variables de entorno
- Configuración de proxy inverso (Nginx/Apache)
- Verificaciones post-despliegue
- Solución de problemas comunes

### [`HTTPS_CHECKLIST.md`](./HTTPS_CHECKLIST.md)

**Lista de verificación para el deploy**

- Checklist paso a paso
- Pre-requisitos necesarios
- Verificaciones de seguridad
- Plan de rollback
- Comandos de emergencia

### [`SCRIPTS_README.md`](./SCRIPTS_README.md)

**Documentación de scripts de deploy**

- Descripción de scripts disponibles
- Instrucciones de uso
- Configuración previa requerida
- Solución de problemas de scripts

## 🎯 Orden Recomendado de Lectura

1. **Primero:** [`HTTPS_MIGRATION.md`](./HTTPS_MIGRATION.md) - Para entender el proceso completo
2. **Segundo:** [`SCRIPTS_README.md`](./SCRIPTS_README.md) - Para conocer las herramientas disponibles
3. **Tercero:** [`HTTPS_CHECKLIST.md`](./HTTPS_CHECKLIST.md) - Para ejecutar el deploy paso a paso

## 🚀 Scripts Disponibles

Los scripts de deploy están ubicados en la carpeta `/scripts/` del proyecto:

- `deploy-https.sh` - Deploy automatizado para Linux/macOS
- `deploy-https.ps1` - Deploy automatizado para Windows
- `test-https-local.sh` - Pruebas locales de configuración HTTPS
- `verify-https.sh` - Verificación post-deploy

## 📞 Contacto

Para dudas sobre el proceso de deploy HTTPS, consultar con el equipo de desarrollo.
