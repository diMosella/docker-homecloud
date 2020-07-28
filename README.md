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

2.12 Set `NODE_ENV` in `flw.env`

2.13 Set `LOG_LEVEL` in `flw.env`

3. Build the containers (WARNING: this step deprecated, it is included in docker-compose)

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

**WARNING**: using image fpm-alpine will result in a failure, due to missing dependencies and wrong linking!

9. It is possible that there is a mention of trusted domains or HTTP 400 (Bad request)

  - check `sudo docker exec -u www-data -ti cloud-server php occ config:system:get trusted_domains` if domain and proxy-server are listed, otherwise:
  - `sudo docker exec -u www-data -ti cloud-server php occ config:system:set trusted_domains 2 --value=proxy-server`

10. It is also possible that you receive several HTTP 50x reponses

  - check `sudo docker exec -u www-data cloud-server ls -al /var/www` if there are folder which don't list www-data:root as permissions, do:
  - `sudo docker exec cloud-server chown -R www-data:root /var/www`

11. To remove Docker containers:

  - `sudo docker rm $(sudo docker ps -q)`

12. To remove Docker images:

  - `sudo docker rmi $(sudo docker images -q)`

13. To fix OnlyOffice not saving changes in NextCloud:

  - `sudo docker exec -ti -u www-data -e crontab`
  - `*/5 * * * * php -f /var/www/nextcloud/occ documentserver:flush; php -f /var/www/nextcloud/cron.php > /dev/null 2>&1`

14. Fix for no connection NC 19 to OnlyOffice:
  - `sudo docker exec -u www-data cloud-server php occ config:system:set onlyoffice verify_peer_off --value=true --type=boolean` (self-signed certs)
  - `sudo docker exec -u www-data cloud-server php occ config:system:set allow_local_remote_servers --value=true --type=boolean`
