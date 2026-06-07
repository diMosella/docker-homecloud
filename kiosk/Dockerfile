FROM debian:stable-slim

# install sed, avahi-tools, libgcc; set timezone
# each RUN creates a separate layer
RUN apt update && TZ="Europe/Amsterdam" apt install -y \
    tzdata
    #tzdata \
    #avahi-utils

CMD cd /opt/kiosk/data && ../software/server

# command that wrappes incoming commands, clearing kiosk default
ENTRYPOINT []
