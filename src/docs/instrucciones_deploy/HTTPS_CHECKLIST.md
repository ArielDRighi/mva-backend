# ✅ Checklist de Migración HTTPS - Backend MVA

## Pre-requisitos

- [ ] Acceso al panel de control de Hostinger
- [ ] Dominio configurado y apuntando al servidor
- [ ] Acceso SSH al servidor de Hostinger
- [ ] Node.js y npm instalados en el servidor

## 1. Configuración SSL en Hostinger

- [ ] Activar certificado SSL gratuito (Let's Encrypt) desde el panel
- [ ] Anotar las rutas de los certificados SSL:
  - Certificado: `/home/usuario/ssl/certificate.crt`
  - Clave privada: `/home/usuario/ssl/private.key`
- [ ] Verificar que los certificados estén instalados correctamente

## 2. Preparación del Código

- [ ] Verificar que `main.ts` esté actualizado con configuración HTTPS
- [ ] Crear archivo `.env` en producción con variables correctas
- [ ] Subir código actualizado al servidor

## 3. Variables de Entorno (Archivo .env)

```bash
- [ ] NODE_ENV=production
- [ ] SSL_CERT_PATH=/ruta/al/certificate.crt
- [ ] SSL_KEY_PATH=/ruta/al/private.key
- [ ] FRONTEND_URL=https://tu-dominio-frontend.com
- [ ] PORT=3000 (o el puerto que uses)
- [ ] DB_HOST=tu_host_bd
- [ ] DB_PORT=5432
- [ ] DB_USERNAME=tu_usuario
- [ ] DB_PASSWORD=tu_password
- [ ] DB_DATABASE=tu_base_datos
- [ ] JWT_SECRET=tu_secreto_jwt
- [ ] EMAIL_USER=tu_email
- [ ] EMAIL_PASS=tu_password_email
```

## 4. Despliegue

### Opción A: Script Automatizado

- [ ] Ejecutar: `./scripts/deploy-https.sh`

### Opción B: Manual

- [ ] `npm ci --production`
- [ ] `npm run build`
- [ ] Configurar variables de entorno
- [ ] Reiniciar servicio

## 5. Configuración del Servidor Web

### Si usas Nginx:

- [ ] Configurar proxy inverso para HTTPS
- [ ] Configurar redirección HTTP → HTTPS
- [ ] Reiniciar Nginx

### Si usas Apache:

- [ ] Configurar VirtualHost para HTTPS
- [ ] Configurar redirección HTTP → HTTPS
- [ ] Reiniciar Apache

## 6. Verificaciones Post-Despliegue

- [ ] Verificar que HTTPS funciona: `curl -k https://tu-dominio.com/api`
- [ ] Verificar que HTTP redirige a HTTPS
- [ ] Probar CORS desde el frontend
- [ ] Verificar logs de errores
- [ ] Probar endpoints principales de la API

## 7. Configuración del Frontend

- [ ] Actualizar URLs de `http://` a `https://` en el frontend
- [ ] Actualizar variable `FRONTEND_URL` en el backend
- [ ] Verificar que no hay mixed content warnings

## 8. Monitoreo y Mantenimiento

- [ ] Configurar monitoreo de certificados SSL
- [ ] Configurar renovación automática de certificados
- [ ] Documentar nuevas URLs para el equipo

## 9. Rollback Plan (Si algo sale mal)

- [ ] Revertir a versión anterior del código
- [ ] Cambiar `NODE_ENV` a `development` temporalmente
- [ ] Restaurar configuración HTTP temporal
- [ ] Investigar y corregir problemas

## 🆘 Comandos de Emergencia

### Verificar estado del servicio:

```bash
# PM2
pm2 status
pm2 logs mva-backend

# systemd
systemctl status mva-backend
journalctl -u mva-backend -f

# Manual
ps aux | grep node
netstat -tlnp | grep :3000
```

### Reiniciar servicio:

```bash
# PM2
pm2 restart mva-backend

# systemd
sudo systemctl restart mva-backend

# Manual
pkill -f "node.*main.js"
nohup node dist/src/main.js &
```

### Verificar certificados:

```bash
openssl x509 -in /path/to/certificate.crt -text -noout
openssl s_client -connect tu-dominio.com:443
```

## 📞 Contactos de Emergencia

- Soporte técnico Hostinger: [información de contacto]
- Administrador del sistema: [información de contacto]
- Desarrollador principal: [información de contacto]

## 📝 Notas Adicionales

- Fecha de migración: ******\_\_\_******
- Versión del certificado SSL: ******\_\_\_******
- Fecha de expiración del certificado: ******\_\_\_******
- Problemas encontrados: ******\_\_\_******
- Soluciones aplicadas: ******\_\_\_******
