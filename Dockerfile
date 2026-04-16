FROM node:18.19.0 AS builder

COPY . /usr/src/app
WORKDIR /usr/src/app

FROM amd64/nginx:1.21.1
COPY --from=builder /usr/src/app/dist/ /usr/share/nginx/html/
RUN rm -rf /etc/nginx/conf.d&& \
  mkdir -p /usr/share/nginx/html/js/
COPY ./default.conf /etc/nginx/conf.d/

# COPY config.js.template /etc/nginx/templates/config.js.template
# ENV NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html/js
