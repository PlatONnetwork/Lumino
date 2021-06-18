## Installing Docker

To run the docker container you must first have installed Docker.

- [Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows)
- [Mac](https://hub.docker.com/editions/community/docker-ce-desktop-mac)
- [Linux](https://docs.docker.com/engine/install/)


For experienced users that wish to perform the computation as fast as possible, the user is encouraged to adjust the Docker preferences to provide access to all system cores and at least `XGB` of memory.

## Launching

To ensure the user has the latest version of the client application, first run:

```
## Download the bn version image
sudo docker pull gcr.io/lumino-server/setup-mpc-client-bn:1.0.0  ## bn version image

## If you are unable to access the external network and cannot pull the image, you can use the following command to pull the image
sudo docker pull registry-intl.cn-shenzhen.aliyuncs.com/lumino-server/setup-mpc-client-bn:1.0.0
sudo docker tag <image id> setup-mpc-client-bn:latest

## Download the bls version image
sudo docker pull gcr.io/lumino-server/setup-mpc-client-bls:1.0.0 ## bls version image

## If you are unable to access the external network and cannot pull the image, you can use the following command to pull the image
sudo docker pull registry-intl.cn-shenzhen.aliyuncs.com/lumino-server/setup-mpc-client-bls:1.0.0
sudo docker tag <image id> setup-mpc-client-bls:latest
```

The client application can be launched as follows:

```
## Start the docker service of the bn version client
docker run -it -e API_URL=https://lumino.latticex.foundation/api -e PRIVATE_KEY=<private key hex> setup-mpc-client-bn:latest

## Start the docker service of the bls version client
docker run -it -e API_URL=https://lumino-bls.latticex.foundation/api -e PRIVATE_KEY=<private key hex> setup-mpc-client-bls:latest
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
      API_URL: 'https://lumino.latticex.foundation/api' ## bls版本对应的URL为https://lumino-bls.latticex.foundation/api
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


