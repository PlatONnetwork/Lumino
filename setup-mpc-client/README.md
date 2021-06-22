## Machine Configuration

We recommend a basic machine configuration as: 4 cores 8 GB RAM, plus a free storage of 12 GB. For the Internet, we recommend at least 1 Mb for upload and download.
You can use a local PC like a desktop or laptop, or you can setup a cloud machine instance to join Lumino. Our back-end servers for both elliptic curves are located in Google Cloud Singapore.

## Installing Docker

To run the docker container you must first have installed Docker.

- [Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows)
- [Mac](https://hub.docker.com/editions/community/docker-ce-desktop-mac)
- [Linux](https://docs.docker.com/engine/install/)


For experienced users that wish to perform the computation as fast as possible, the user is encouraged to adjust the Docker preferences to provide access to all system cores and at least `XGB` of memory.

## Launching

To ensure the user has the latest version of the client application, first run:

### bn version

+ pull docker images
```
## Download the bn version image
sudo docker pull gcr.io/lumino-server/setup-mpc-client-bn:1.0.0  ## bn version image

## If you are unable to access the external network and cannot pull the image, you can use the following command to pull the image
sudo docker pull registry-intl.cn-shenzhen.aliyuncs.com/lumino-server/setup-mpc-client-bn:1.0.0
```

+ tag docker image

```
## search pulled docker image id
sudo docker images

Example docker images show: 
REPOSITORY                                                                  TAG       IMAGE ID       CREATED      SIZE
registry-intl.cn-shenzhen.aliyuncs.com/lumino-server/setup-mpc-client-bn    1.0.0     3549355da488   4 days ago   2.17GB

## tag docker image
sudo docker tag <image id> setup-mpc-client-bn:latest

Example:
sudo docker tag 3549355da488 setup-mpc-client-bn:latest
```

### bls version

+ pull docker images
```
## Download the bls version image
sudo docker pull gcr.io/lumino-server/setup-mpc-client-bls:1.0.0  ## bn version image

## If you are unable to access the external network and cannot pull the image, you can use the following command to pull the image
sudo docker pull registry-intl.cn-shenzhen.aliyuncs.com/lumino-server/setup-mpc-client-bls:1.0.0
```

+ tag docker image
```
## search pulled docker image id
sudo docker images

Example docker images show: 
REPOSITORY                                                                  TAG       IMAGE ID       CREATED      SIZE
registry-intl.cn-shenzhen.aliyuncs.com/lumino-server/setup-mpc-client-bls    1.0.0     54dc98b49b1e   4 days ago   2.17GB

## tag docker image
sudo docker tag <image id> setup-mpc-client-bls:latest

Example:
sudo docker tag 54dc98b49b1e setup-mpc-client-bls:latest
```

### Launch client application
The client application can be launched as follows:

```
## Start the docker service of the bn version client
docker run -it -e API_URL=https://lumino.latticex.foundation/api -e PRIVATE_KEY=<private key hex start with 0x> setup-mpc-client-bn:latest

## Start the docker service of the bls version client
docker run -it -e API_URL=https://lumino-bls.latticex.foundation/api -e PRIVATE_KEY=<private key hex start with 0x> setup-mpc-client-bls:latest
```
or

docker-compose.yml: 
```
version: '3'
services:
  setup-mpc-client:
    image: setup-mpc-client-bn ## Take the bn version as an example, if you need to start the bls version, modify it to setup-mpc-client-bls
    tty: true
    environment:
      API_URL: 'https://lumino.latticex.foundation/api' ## bls version API_URL setting to https://lumino-bls.latticex.foundation/api
      PRIVATE_KEY: '0x75c59ab2ab59202d874ddeda943041ab03ed9a785d1ac503011c8f054af187b0'
```

```
sudo docker-compose -f docker-compose.yml up -d
```

Example:

```
docker run -it --name setup-mpc-client-bn -e PRIVATE_KEY=0x75c59ab2ab59202d874ddeda943041ab03ed9a785d1ac503011c8f054af187b0 -e API_URL=https://lumino.latticex.foundation/api setup-mpc-client-bn:latest
docker run -it --name setup-mpc-client-bls -e PRIVATE_KEY=0x75c59ab2ab59202d874ddeda943041ab03ed9a785d1ac503011c8f054af187b0 -e API_URL=https://lumino-bls.latticex.foundation/api setup-mpc-client-bls:latest
```


