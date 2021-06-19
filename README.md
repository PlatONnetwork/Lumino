Welcome to Lumino's main code repository. This repo contains several components for establishing the multi-party computation ceremony.

`setup-mpc-client` is the first entrance for normal user to setup the environment with our provided software and related dependencies.

`setup-mpc-server` is the code for the backend servers running by LatticeX foundation during the whole ceremony.

`setup-mpc-web` is the web pages for monitoring the progress and the status of Lumino.

`setup-mpc-common` is the interactive logics between backend server and clients.

`algorithm` is the underlying cryptographic algorithms to handling the calculation and verifications on elliptic curve points, which is the CRSs for setup a Plonk system.