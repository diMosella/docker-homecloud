FROM node:alpine

# install file, exiftool, imagemagick, ffmpeg and set timezone
# each RUN creates a seperate layer
RUN apk add --update --no-cache \
    curl \
    file \
    exiftool \
    imagemagick \
    libvpx \
    libvorbis \
    ffmpeg \
    ocrmypdf \
    tzdata \
    sed &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\
    echo "Europe/Amsterdam" > /etc/timezone &&\
    apk del tzdata &&\
    rm -rf /var/cache/apk/*

HEALTHCHECK CMD curl -X POST localhost:8000/status
# FIXME: how to check response?
# HEALTHCHECK --interval=DURATION (default: 30s) --timeout=DURATION (default: 30s) --start-period=DURATION (default: 0s)  --retries=N (default: 3) CMD curl -X POST localhost:8000/status

CMD /usr/sbin/crond -f
# command > file 2>&1
# > = 1> = stdout; 2> = stderr, redirected to &1 = stdout-file

# command that wrappes incoming commands, clearing restic default
ENTRYPOINT []


# FROM node:10.6.0-alpine AS build
# WORKDIR /src
# COPY MyWebApp/package*.json ./
# RUN npm install <-- creates a new layer, thus successive builds don't have to rerun (it's cached)
# COPY MyWebApp/ .
# RUN npm run build

# FROM nginx:alpine
# EXPOSE 80
# COPY MyWebApp/nginx.conf /etc/nginx/nginx.conf
# COPY --from=build /src/dist/ /var/www/
