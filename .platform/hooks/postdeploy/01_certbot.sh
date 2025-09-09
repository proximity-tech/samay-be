#!/bin/bash
# Post-deploy hook for Elastic Beanstalk
# Installs Certbot, issues Let's Encrypt cert, and reloads Nginx

set -xe

DOMAIN="samay.prox.engineering"
EMAIL="chenchunaidu.m@proximity.tech"

# Install Certbot (Amazon Linux 2)
if ! command -v certbot >/dev/null 2>&1; then
  amazon-linux-extras enable epel
  yum install -y certbot python3-certbot-nginx
fi

# Request/renew certificate
certbot certonly --nginx \
  -d $DOMAIN \
  -m $EMAIL \
  --agree-tos \
  --non-interactive \
  --redirect

# Ensure Nginx config uses cert
NGINX_CONF="/etc/nginx/conf.d/ssl_app.conf"
if [ ! -f "$NGINX_CONF" ]; then
  cat > $NGINX_CONF <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;  # update if your app listens on a different port
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
fi

# Reload Nginx with new cert
nginx -t && systemctl reload nginx
