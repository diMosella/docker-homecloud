FROM node:alpine AS build
WORKDIR /home/flows
COPY ./package*.json ./
# create a new layer, thus caching
RUN npm ci --only=production
COPY ./src/ ./src/
RUN npm run build

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
WORKDIR /home/flows
COPY --from=build /home/flows/dist ./dist

HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost:8000/status || exit 1
# FIXME: how to check response?
var http = require("http");

var options = {
    host : "localhost",
    port : "2368",
    timeout : 2000
};

var request = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode == 200) {
        process.exit(0);
    }
    else {
        process.exit(1);
    }
});

request.on('error', function(err) {
    console.log('ERROR');
    process.exit(1);
});

request.end();
# HEALTHCHECK --interval=DURATION (default: 30s) --timeout=DURATION (default: 30s) --start-period=DURATION (default: 0s)  --retries=N (default: 3) CMD curl -X POST localhost:8000/status

CMD [ "node" , "/home/flows/dist/flows.mjs" ]
# command > file 2>&1
# > = 1> = stdout; 2> = stderr, redirected to &1 = stdout-file

# command that wrappes incoming commands, clearing restic default
ENTRYPOINT []
