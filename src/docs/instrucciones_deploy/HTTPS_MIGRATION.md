# Guía de Migración a HTTPS - Backend MVA

## Pasos para migrar de HTTP a HTTPS en Hostinger

### 1. Obtener Certificados SSL

#### Opción A: SSL Let's Encrypt (Recomendado - Gratuito)

1. Accede al panel de control de Hostinger
2. Ve a la sección "SSL/TLS" o "Seguridad"
3. Activa el certificado SSL gratuito para tu dominio
4. Anota las rutas donde se almacenan los certificados:
   - Certificado: `/path/to/certificate.crt`
   - Clave privada: `/path/to/private.key`

#### Opción B: SSL Comercial

1. Compra un certificado SSL desde el panel de Hostinger
2. Sigue las instrucciones de instalación
3. Anota las rutas de los archivos de certificado

### 2. Configurar Variables de Entorno

Crea o actualiza tu archivo `.env` en producción con:

```bash
NODE_ENV=production
SSL_CERT_PATH=/path/to/your/certificate.crt
SSL_KEY_PATH=/path/to/your/private.key
FRONTEND_URL=https://tu-dominio-frontend.com
PORT=443  # o el puerto que uses para HTTPS
```

### 3. Actualizaciones de Código

El archivo `main.ts` ya está configurado para:

- ✅ Cargar certificados SSL automáticamente en producción
- ✅ Configurar CORS para HTTPS
- ✅ Mostrar el protocolo correcto en los logs

### 4. Despliegue en Hostinger

#### Opción A: Usando el script automatizado

```bash
# Hacer el script ejecutable
chmod +x scripts/deploy-https.sh

# Editar las rutas en el script
nano scripts/deploy-https.sh

# Ejecutar el despliegue
./scripts/deploy-https.sh
```

#### Opción B: Despliegue manual

```bash
# 1. Subir código al servidor
git pull origin main

# 2. Instalar dependencias
npm ci --production

# 3. Compilar el proyecto
npm run build

# 4. Configurar variables de entorno
cp .env.production.example .env
nano .env  # Editar con tus valores reales

# 5. Reiniciar el servicio
pm2 restart mva-backend
# o
systemctl restart mva-backend
```

### 5. Configurar Proxy Inverso (Opcional pero Recomendado)

Si Hostinger usa Nginx o Apache, configura un proxy inverso:

#### Nginx

```nginx
server {
    listen 443 ssl;
    server_name tu-dominio.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache

```apache
<VirtualHost *:443>
    ServerName tu-dominio.com

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    ProxyPreserveHost On
</VirtualHost>
```

### 6. Verificaciones Post-Despliegue

#### Verificar que HTTPS funciona:

```bash
curl -k https://tu-dominio.com/api
```

#### Verificar certificado SSL:

```bash
openssl s_client -connect tu-dominio.com:443
```

#### Verificar logs de la aplicación:

```bash
# Si usas PM2
pm2 logs mva-backend

# Si usas systemd
journalctl -u mva-backend -f

# Si usas archivo de log
tail -f /var/log/mva-backend.log
```

### 7. Configurar Redirección HTTP → HTTPS

En tu configuración de servidor web, agrega una redirección:

#### Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    Redirect permanent / https://tu-dominio.com/
</VirtualHost>
```

### 8. Actualizar Frontend

No olvides actualizar las URLs en tu frontend de `http://` a `https://`.

### 9. Monitoreo

Configura monitoreo para verificar que el certificado SSL no expire:

```bash
# Script para verificar expiración de certificado
openssl x509 -in /path/to/certificate.crt -text -noout | grep "Not After"
```

### Solución de Problemas Comunes

#### Error: "Certificate not found"

- Verificar que las rutas en las variables de entorno sean correctas
- Verificar permisos de lectura en los archivos de certificado

#### Error: "Permission denied"

- Asegurar que el usuario que ejecuta Node.js tenga permisos de lectura

#### Error: "EADDRINUSE"

- Verificar que el puerto no esté siendo usado por otro proceso
- Cambiar el puerto en las variables de entorno

#### CORS errors después de HTTPS

- Actualizar `FRONTEND_URL` en las variables de entorno
- Verificar configuración de CORS en `main.ts`

### Contacto y Soporte

Para problemas específicos de Hostinger, contacta su soporte técnico con:

- Los pasos realizados
- Los mensajes de error exactos
- Los logs de la aplicación
