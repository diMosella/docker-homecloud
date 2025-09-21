FROM debian:stable-slim

# install sed, avahi-tools, libgcc; set timezone
# each RUN creates a separate layer
RUN apt update && apt upgrade && TZ="Europe/Amsterdam" apt install -y \
    tzdata
    #tzdata \
    #avahi-utils

CMD /opt/kiosk/server

# command that wrappes incoming commands, clearing kiosk default
ENTRYPOINT []
