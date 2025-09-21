FROM debian:stable-slim

# install sed, avahi-tools, libgcc; set timezone
# each RUN creates a separate layer
RUN apt update && DEBIAN_FRONTEND="noninteractive" TZ="Europe/Amsterdam" apt install -y --no-install-recommends \
    tzdata \
    avahi-utils \
    sed && \
    sed -i 's/.*enable-dbus=.*/enable-dbus=no/' /etc/avahi/avahi-daemon.conf

CMD avahi-daemon --daemonize --no-drop-root && /opt/kiosk/server

# command that wrappes incoming commands, clearing kiosk default
ENTRYPOINT []
