# Base image
#
FROM node:alpine AS base

ENV LANG=C.UTF-8

RUN apk add --update --no-cache \
  python3 \
  py3-img2pdf \
  pixman \
  jbig2enc

# Builds
#
FROM base AS nodeBuild
WORKDIR /home/flows
COPY ./package*.json ./
# create a new layer, for caching
RUN npm install
# RUN npm ci --only=production
COPY ./src/ ./src/
COPY ./rollup.config.js ./
RUN npm run build

FROM base AS pythonBuild

RUN apk add --update --no-cache \
  build-base autoconf automake libtool \
  leptonica-dev \
  zlib-dev \
  python3-dev \
  py3-setuptools \
  py3-cffi \
  py3-pdfminer \
  py3-pikepdf \
  py3-pluggy \
  py3-pillow \
  py3-reportlab \
  py3-tqdm \
  ca-certificates \
  qpdf-dev \
  curl \
  libffi-dev

WORKDIR /app

# Install the latest pip and ocrmypdf
RUN \
  curl https://bootstrap.pypa.io/get-pip.py | python3 &&\
  curl -L https://github.com/jbarlow83/OCRmyPDF/archive/v10.2.1.tar.gz | \
  tar xz -C . --strip-components=1 &&\
  pip3 install --no-cache-dir .

# Final
#
FROM base
# install file, exiftool, imagemagick, ffmpeg and set timezone
# each RUN creates a seperate layer
RUN apk add --update --no-cache \
    exiftool \
    rawtherapee \
    imagemagick \
    ffmpeg \
    ghostscript \
    libxslt \
    pngquant \
    qpdf \
    tesseract-ocr \
    unpaper \
    tzdata \
    sed &&\
    cp /usr/share/zoneinfo/Europe/Amsterdam /etc/localtime &&\
    echo "Europe/Amsterdam" > /etc/timezone &&\
    apk del tzdata &&\
    rm -rf /var/cache/apk/*
# add OCR build
WORKDIR /home/flows/app
COPY --from=pythonBuild /usr/lib/python3.8/site-packages/ /usr/lib/python3.8/site-packages/
COPY --from=pythonBuild /usr/bin/ocrmypdf /usr/bin/ocrmypdf
COPY ./src/assets/*.traineddata /usr/share/tessdata/
# add FLOWS build
WORKDIR /home/flows
COPY --from=nodeBuild /home/flows/dist/ ./dist/
COPY ./test/healthCheck.mjs ./test/
COPY ./src/assets/ /usr/share/tesseract-ocr/4.00/tessdata/

HEALTHCHECK --interval=5m --timeout=3s CMD [ "node", "./test/healthCheck.mjs" ] || exit 1

CMD [ "node" , "/home/flows/dist/flows.mjs" ]
# command > file 2>&1
# > = 1> = stdout; 2> = stderr, redirected to &1 = stdout-file

# command that wrappes incoming commands, clearing default value
ENTRYPOINT []
