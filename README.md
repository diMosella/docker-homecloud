## Document Server and Nextcloud Docker installation

Document Server and Nextcloud Docker installation will install the preconfigured version of [ONLYOFFICE Document Server][2] connected to Nextcloud to your server running them in Docker containers.
Forked from [https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud](https://github.com/ONLYOFFICE/docker-onlyoffice-owncloud), since then OnlyOffice launched a new repository: [https://github.com/ONLYOFFICE/docker-onlyoffice-nextcloud](https://github.com/ONLYOFFICE/docker-onlyoffice-nextcloud)

## Requirements

* The latest version of Docker (can be downloaded here: [https://docs.docker.com/engine/installation/](https://docs.docker.com/engine/installation/))
* Docker compose (can be downloaded here: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/))

## TODO

* Update to latest Nextcloud and OnlyOffice dockers

## Installation

1. Get the latest version of this repository running the command:

```
git clone --recursive https://gitlab.com/diMosella/docker-homecloud.git nextCloud-onlyOffice
cd nextCloud-onlyOffice
git submodule update --remote
```

2. Edit the config files:

2.1 Set the MYSQL_ROOT_PASSWORD in `docker-compose.yml`

2.2 Set the MYSQL_PASSWORD in `db.env`

2.3 Set server_name in `nginx.conf`

2.4 Set ssl_certificate in `nginx.conf` (remind to use the full chain)

2.5 Set ssl_certificate_key in `nginx.conf`

3. Run Docker Compose:

```
docker-compose up -d
```
(other commands `docker-compose up -d --force-recreate`, `docker-compose stop` and `docker-compose down -v` (`-v` to remove volumes))

**Please note**: you might need to wait a couple of minutes when all the containers are up and running after the above command.

4. Now launch the browser and enter the webserver address. The ownCloud/Nextcloud wizard webpage will be opened. Enter all the necessary data to complete the wizard.

5. Go to the project folder and run the `set_configuration.sh` script:

```
bash set_configuration.sh
```

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
