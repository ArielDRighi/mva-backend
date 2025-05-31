# 🔧 Scripts de Despliegue HTTPS - MVA Backend

Este directorio contiene scripts para facilitar la migración y gestión de HTTPS en el backend de MVA.

## 📁 Archivos Disponibles

### `deploy-https.sh` (Linux/macOS)

Script automatizado para desplegar el backend con configuración HTTPS en servidores Linux.

**Uso:**

```bash
./scripts/deploy-https.sh
```

**Funciones:**

- ✅ Verificación de certificados SSL
- 📦 Backup automático
- 📥 Instalación de dependencias
- 🔨 Compilación del proyecto
- 🔄 Reinicio del servicio
- 🔍 Verificación post-despliegue

### `deploy-https.ps1` (Windows)

Script equivalente para sistemas Windows con PowerShell.

**Uso:**

```powershell
.\scripts\deploy-https.ps1
```

### `verify-https.sh`

Script para verificar la configuración HTTPS después del despliegue.

**Uso:**

```bash
# Verificar localhost
./scripts/verify-https.sh

# Verificar dominio específico
./scripts/verify-https.sh mi-dominio.com

# Verificar dominio y puerto específico
./scripts/verify-https.sh mi-dominio.com 443
```

**Verificaciones:**

- 🌐 Conectividad HTTPS
- 🔐 Validez de certificados SSL
- 🔗 Configuración CORS
- ⚙️ Variables de entorno
- 🔌 Puertos en uso

### `test-https-local.sh`

Script para probar la configuración HTTPS localmente antes del despliegue.

**Uso:**

```bash
./scripts/test-https-local.sh
```

**Funciones:**

- 🧪 Creación de certificados SSL de prueba
- 🔧 Configuración de entorno local
- 🚀 Inicio de servidor de prueba
- ✅ Verificación de funcionalidad
- 🧹 Limpieza automática

## 🎯 Scripts NPM

Los siguientes comandos están disponibles en `package.json`:

```bash
# Probar HTTPS localmente
npm run test:https

# Verificar configuración HTTPS
npm run verify:https

# Desplegar con HTTPS
npm run deploy:https

# Iniciar en modo HTTPS (producción)
npm run start:https
```

## 🔧 Configuración Previa

Antes de usar estos scripts, asegúrate de:

1. **Obtener certificados SSL** en Hostinger
2. **Configurar variables de entorno** según `.env.production.example`
3. **Tener permisos** de ejecución en los scripts

## 📋 Variables de Entorno Requeridas

Para producción, estas variables deben estar configuradas:

```bash
NODE_ENV=production
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
FRONTEND_URL=https://tu-dominio-frontend.com
PORT=3000
```

## 🚨 Solución de Problemas

### Permisos de Ejecución

```bash
chmod +x scripts/*.sh
```

### Scripts no ejecutan en Windows

Usar PowerShell o WSL:

```powershell
# PowerShell
.\scripts\deploy-https.ps1

# WSL
bash scripts/deploy-https.sh
```

### Error de certificados SSL

1. Verificar rutas en variables de entorno
2. Verificar permisos de lectura
3. Regenerar certificados si es necesario

### Puerto en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Matar proceso específico
kill -9 [PID]
```

## 📖 Recursos Adicionales

- [`HTTPS_MIGRATION.md`](./HTTPS_MIGRATION.md) - Guía completa de migración
- [`HTTPS_CHECKLIST.md`](./HTTPS_CHECKLIST.md) - Lista de verificación
- [Documentación de Hostinger SSL](https://support.hostinger.com/en/articles/1583467-how-to-install-ssl-certificate)

## 🤝 Contribuciones

Para mejorar estos scripts:

1. Hacer fork del repositorio
2. Crear rama feature: `git checkout -b feature/improve-scripts`
3. Commit cambios: `git commit -am 'Improve deployment scripts'`
4. Push a la rama: `git push origin feature/improve-scripts`
5. Crear Pull Request

## 📞 Soporte

Si tienes problemas con estos scripts:

1. Revisar logs de error
2. Consultar documentación
3. Contactar al equipo de desarrollo
4. Abrir issue en el repositorio
