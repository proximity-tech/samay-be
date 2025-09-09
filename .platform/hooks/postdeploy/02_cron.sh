#!/bin/bash
# Ensure certs auto-renew
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
