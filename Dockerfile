# =============================================================================
# Dockerfile — action-runner-web dev server
#
# BUILD
#   docker build -t action-runner-web-dev .
#
# RUN (with local file watching)
#   docker run --rm -it \
#     -p 5173:5173 \
#     -v $(pwd):/app \
#     action-runner-web-dev
#
# To pass a backend API target:
#   -e VITE_API_BASE=http://host.docker.internal:8000
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# Copy manifests first so this layer is cached independently of source changes.
COPY package.json package-lock.json ./

RUN npm ci --include=dev

# Copy the full project source.
# When a host volume is mounted at runtime it overlays this layer.
COPY . .

# Vite default dev server port.
EXPOSE 5173

# Bind Vite to all interfaces so the port is reachable from outside the container.
# vite.config.ts reads VITE_HOST_IP and passes it to server.host.
ENV VITE_HOST_IP=0.0.0.0

# Docker on macOS does not forward inotify events into Linux containers.
# Chokidar polling ensures Vite HMR works correctly with a volume-mounted src tree.
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]
