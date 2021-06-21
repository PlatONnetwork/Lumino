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
yarn build:sit (test environment)

yarn build:prod (production environment)

```
### Lints and fixes files

```
yarn lint
```

### how to deploy

- setting nginx.conf in your nginx like this

```
    server {
    listen       8002; 
    server_name  _;    
    client_max_body_size  20m;
    charset utf-8;
    #access_log  logs/host.access.log  main;

    location / { // Static web file
            root   /home/web/mpc-setup-web; // You can change it to any directory in your nginx, and put the dist file to this path
            index  index.html index.htm;
            try_files $uri $uri/ /index.html;
    }
   
    location /api/ {
            proxy_pass http://10.10.8.176:8080/api/;  // BN254 request forwarding
            proxy_redirect          default;
            proxy_set_header        Host $host:$proxy_port;
            proxy_set_header        X-Real-IP $remote_addr;
            proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /right-api/ {
            proxy_pass http://10.10.8.177:8080/api/;  // BLS12-318 request forwarding
            proxy_redirect          default;
            proxy_set_header        Host $host:$proxy_port;
            proxy_set_header        X-Real-IP $remote_addr;
            proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    error_page   500 502 503 504  /50x.html;
            location = /50x.html {
                root   html;
            }

    }

```
