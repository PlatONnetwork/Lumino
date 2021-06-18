# mpc-setup-web

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn dev
```

### Compiles and minifies for production

```
yarn build
```

### Lints and fixes files

```
yarn lint
```

### how to deploy

nginx.conf

```
    server {
    listen       8002;
    server_name  _;
    client_max_body_size  20m;
    charset utf-8;

    #access_log  logs/host.access.log  main;

    location / {
        root   /home/web/mpc-setup-web;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
   
   location /api/ {
        proxy_pass http://172.222.222.74/api/;
        proxy_redirect          default;
       	proxy_set_header        Host $host:$proxy_port;
       	proxy_set_header        X-Real-IP $remote_addr;
       	proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
   }
```
