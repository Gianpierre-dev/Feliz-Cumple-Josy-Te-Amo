FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html styles.css script.js /srv/
COPY img/*.jpg /srv/img/
COPY audio /srv/audio
