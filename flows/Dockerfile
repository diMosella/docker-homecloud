FROM node:alpine AS build
WORKDIR /home/flows
COPY ./package*.json ./
# create a new layer, thus caching
RUN npm install
# RUN npm ci --only=production
COPY ./src/ ./src/
COPY ./rollup.config.js ./
RUN npm run build

FROM node:alpine
# install file, exiftool, imagemagick, ffmpeg and set timezone
# each RUN creates a seperate layer
RUN apk add --update --no-cache \
    exiftool \
    rawtherapee \
    imagemagick \
    ffmpeg \
    ocrmypdf \
    tzdata \
    sed &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\
    echo "Europe/Amsterdam" > /etc/timezone &&\
    apk del tzdata &&\
    rm -rf /var/cache/apk/*
WORKDIR /home/flows
COPY --from=build /home/flows/dist/ ./dist/
COPY ./test/healthCheck.mjs ./test/
COPY ./src/assets/ /usr/share/tesseract-ocr/4.00/tessdata/

HEALTHCHECK --interval=5m --timeout=3s CMD [ "node", "./test/healthCheck.mjs" ] || exit 1

CMD [ "node" , "/home/flows/dist/flows.mjs" ]
# command > file 2>&1
# > = 1> = stdout; 2> = stderr, redirected to &1 = stdout-file

# command that wrappes incoming commands, clearing restic default
ENTRYPOINT []
