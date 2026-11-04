# Despliegue — Retazo

Servidor de pruebas compartido con **CobraCRM** y **autocore**. Aquí no hay contraseñas: están solo en el servidor.

| | |
|---|---|
| URL | **http://138.197.97.254:8081** |
| Servidor | DigitalOcean · Ubuntu 24.04 · 1 vCPU · 512 MB RAM + 2 GB swap |
| IP / SSH | `138.197.97.254` · usuario `root`, acceso con llave SSH |
| Stack | Nginx 1.24 · PHP 8.4-FPM · MySQL 8.0 · Composer · cron · firewall UFW |
| Código | `/var/www/retazo` (clonado de `github.com/AngelRdz2/retazo`, rama `master`) |
| Base de datos | MySQL `retazo`, usuario `retazo` (contraseña en el `.env` del servidor) |

Otros sistemas en el mismo servidor: CobraCRM → `http://138.197.97.254`, autocore → `http://138.197.97.254:8082`.

## 1. Conectarse al servidor

El acceso es con llave SSH (no se comparten contraseñas).

1. Crea tu llave, si no tienes una (en PowerShell o Terminal):
   ```bash
   ssh-keygen -t ed25519
   ```
2. Envía al administrador del servidor el contenido de tu llave **pública** (`~/.ssh/id_ed25519.pub`; nunca el archivo sin `.pub`).
3. El administrador la agrega en el servidor:
   ```bash
   echo "ssh-ed25519 AAAA... tu@equipo" >> /root/.ssh/authorized_keys
   ```
4. Conéctate:
   ```bash
   ssh root@138.197.97.254
   ```

## 2. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Código | `/var/www/retazo` (dueño `www-data`) |
| Configuración | `/var/www/retazo/.env` (`APP_ENV=production`, `APP_DEBUG=false`) |
| Assets compilados | `/var/www/retazo/public/build` (se compilan en tu PC, no en el servidor) |
| Archivos subidos | `/var/www/retazo/storage/app/public` (enlazado en `public/storage`) |
| Log de Laravel | `/var/www/retazo/storage/logs/laravel.log` |
| Nginx | `/etc/nginx/sites-available/retazo` (puerto 8081) · logs en `/var/log/nginx/` |
| Cola y programador (cron) | `/etc/cron.d/laravel-retazo`: `schedule:run` y `queue:work --stop-when-empty` cada minuto |
| Usuario administrador | `/root/credenciales.txt` (solo lo lee root) |
| Script de despliegue | `/root/deploy/deploy-app.sh` |

## 3. Actualizar el sistema

El servidor tiene solo 512 MB de RAM, así que **el frontend (React + Vite) se compila en tu PC** y se sube ya compilado. La compilación usa Wayfinder, que ejecuta `php artisan`: hazla con PHP disponible (por ejemplo con Herd).

1. Sube tus cambios a GitHub (`master`):
   ```bash
   git push origin master
   ```
2. Compila el frontend y empaquétalo (desde la carpeta del proyecto):
   ```bash
   npm run build
   ```
   ```bash
   tar -czf retazo-build.tar.gz public/build
   ```
3. Súbelo al servidor:
   ```bash
   scp retazo-build.tar.gz root@138.197.97.254:/root/deploy/
   ```
4. Despliega (hace `git pull`, instala dependencias, migra, optimiza y recarga Nginx y PHP):
   ```bash
   ssh root@138.197.97.254 "rm -rf /var/www/retazo/public/build && bash /root/deploy/deploy-app.sh retazo"
   ```

Las migraciones se ejecutan con `--force`; revisa que sean seguras antes de desplegar.

## 4. Comandos útiles (en el servidor)

Los comandos de Artisan se ejecutan como `www-data` para no dejar archivos de root:

```bash
cd /var/www/retazo && sudo -u www-data php artisan about
```
```bash
tail -f /var/www/retazo/storage/logs/laravel.log
```
```bash
cd /var/www/retazo && sudo -u www-data php artisan optimize && systemctl reload php8.4-fpm
```
```bash
mysql retazo
```

OPcache no revisa cambios en archivos (`opcache.validate_timestamps=0`): si editas algo a mano en el servidor, recarga PHP con `systemctl reload php8.4-fpm`.

## 5. Notas

- **Sin HTTPS** mientras no haya dominio: las **passkeys** necesitan HTTPS y no funcionan; el inicio de sesión con contraseña sí. Con un dominio apuntando a la IP se activa con Certbot (ya instalado).
- El correo está en `MAIL_MAILER=log`: verificación y recuperación de contraseña no envían correos.
- Solo existe el usuario administrador; no se cargaron las cuentas demo (`*@retazo.test`) ni los torneos de demostración.
- Las respuestas de Inertia llevan encabezados grandes (preload de Vite): Nginx tiene `fastcgi_buffer_size 32k` en `/etc/nginx/conf.d/fastcgi-buffers.conf`. Sin eso, la portada da **502**.
- Las tres apps comparten la IP y las cookies no distinguen puertos: si ves "página expirada" con otra app abierta en el mismo navegador, recarga la página.
