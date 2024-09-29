# Functions for POTW

These are the gcp functions for the POTW project. A standard firebase project.

## Getting Started

`npm install` to install the devdependencies in the root folder.

`cd functions && npm install` to move to the functions folder and install the deps there.

`./scripts/decrypt_secrets.sh -e=local` to decrypt the secrets/config values for the project.

`cd functions && npm run dev` to start the functions emulator.

`npm run initLocalDev will ensure the topics used by the functions are created.`

## Postgresql db

Secrets are in the decrypyed env files. if you modify the models you need to create a run migrations.

`cd functions && npm run migrations:generate --name=<migration name>` to generate the migrations.

`cd functions && npm run migrations:run:<local|dev>` to run the migrations against local or dev.