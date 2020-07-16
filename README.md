## Nextcloud and BitWarden Docker installation

Nextcloud and Bitwarden Docker installation will install Nextcloud and Bitwarden_rs to your server running them in Docker containers.
Initially forked from [https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud](https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud), since then NextCloud and OnlyOffice provided a better integration / installation via Apps.
Now, the instructions (like adding fonts) are from [Nextcloud DocumentServer app](https://github.com/nextcloud/documentserver_community).
For instruction on Restic (for backup) see [Restic documentation](https://restic.readthedocs.io/en/latest/index.html)

## Requirements

* The latest version of Docker (can be downloaded here: [https://docs.docker.com/engine/installation/](https://docs.docker.com/engine/installation/))
* Docker compose (can be downloaded here: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/))

## TODO

- [x] Update to latest Nextcloud and OnlyOffice dockers

## Installation

1. Get the latest version of this repository running the command:

```
git clone https://gitlab.com/diMosella/docker-homecloud.git
cd docker-homecloud
```

2. Edit the config files:

2.1 Set the `MYSQL_ROOT_PASSWORD` in `db.env`

2.2 Set the `MYSQL_PASSWORD` in `db.env`

2.3 Set `server_name`s in `nginx.conf`

2.4 Set `ssl_certificate`s in `nginx.conf` (remind to use the full chain)

2.5 Set `ssl_certificate_key`s in `nginx.conf`

2.6 Set `ADMIN_TOKEN` in `bw.env`

2.7 Set `TOKEN` in `bu.env`

2.8 Set `CLOUD_USER` in `flw.env`

2.9 Set `CLOUD_PWD` in `flw.env`

2.10 Set `CLOUD_URL` in `flw.env`

2.11 Set `CLOUD_TEMP` in `flw.env`

3. Build the containers

3.1 Run ``build.sh`` from ``backup``

3.2 Run ``build.sh`` from ``flows``

4. Run Docker Compose:

```
docker-compose up -d
```
(other commands `docker-compose up -d --force-recreate`, `docker-compose stop` and `docker-compose down -v` (`-v` to remove volumes))

**Please note**: you might need to wait a couple of minutes when all the containers are up and running after the above command.

7. Now launch the browser and enter the webserver address. The NextCloud wizard webpage will be opened. Enter all the necessary data to complete the wizard.

8. Install the necessary apps in NextCloud:

  - Community Document Server
  - ONLYOFFICE

Now you can enter Nextcloud and create a new document. It will be opened in ONLYOFFICE Document Server.
