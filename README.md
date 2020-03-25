## Nextcloud and BitWarden Docker installation

Nextcloud and Bitwarden Docker installation will install Nextcloud and Bitwarden_rs to your server running them in Docker containers.
Initially forked from [https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud](https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud), since then OnlyOffice launched a new repository: [https://github.com/ONLYOFFICE/docker-onlyoffice-nextcloud](https://github.com/ONLYOFFICE/docker-onlyoffice-nextcloud)
Now, the instructions (like adding fonts) are from [https://github.com/nextcloud/documentserver_community](Nextcloud DocumentServer app).

## Requirements

* The latest version of Docker (can be downloaded here: [https://docs.docker.com/engine/installation/](https://docs.docker.com/engine/installation/))
* Docker compose (can be downloaded here: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/))

## TODO

[x] Update to latest Nextcloud and OnlyOffice dockers

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

3. Run Docker Compose:

```
docker-compose up -d
```
(other commands `docker-compose up -d --force-recreate`, `docker-compose stop` and `docker-compose down -v` (`-v` to remove volumes))

**Please note**: you might need to wait a couple of minutes when all the containers are up and running after the above command.

4. Now launch the browser and enter the webserver address. The NextCloud wizard webpage will be opened. Enter all the necessary data to complete the wizard.

Now you can enter Nextcloud and create a new document. It will be opened in ONLYOFFICE Document Server.

## Project Information

Official website: [http://www.onlyoffice.org](http://onlyoffice.org "http://www.onlyoffice.org")

Code repository: [https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud](https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud "https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud")

SaaS version: [http://www.onlyoffice.com](http://www.onlyoffice.com "http://www.onlyoffice.com")

## User Feedback and Support

If you have any problems with or questions about [ONLYOFFICE Document Server][2], please visit our official forum to find answers to your questions: [dev.onlyoffice.org][1] or you can ask and answer ONLYOFFICE development questions on [Stack Overflow][3].

  [1]: http://dev.onlyoffice.org
  [2]: https://github.com/ONLYOFFICE/DocumentServer
  [3]: http://stackoverflow.com/questions/tagged/onlyoffice
