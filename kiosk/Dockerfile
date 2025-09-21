FROM debian:stable-slim

# install sed, avahi-tools, libgcc; set timezone
# each RUN creates a separate layer
RUN apt update && DEBIAN_FRONTEND="noninteractive" TZ="Europe/Amsterdam" apt install -y --no-install-recommends \
    tzdata \
    avahi-utils

CMD /opt/kiosk/server

# command that wrappes incoming commands, clearing kiosk default
ENTRYPOINT []
