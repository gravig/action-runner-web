FROM node:18.19.0 as builder

COPY . /usr/src/app
WORKDIR /usr/src/app
# RUN --mount=type=secret,id=.npm,target=.npmrc,mode=0644 \
#   npm ci --legacy-peer-deps && npm run build

FROM amd64/nginx:1.21.1
COPY --from=builder /usr/src/app/build/ /usr/share/nginx/html/
RUN rm -rf /etc/nginx/conf.d&& \
  mkdir -p /usr/share/nginx/html/js/
COPY ./default.conf /etc/nginx/conf.d/

# COPY config.js.template /etc/nginx/templates/config.js.template
# ENV NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html/js
