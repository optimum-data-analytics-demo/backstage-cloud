# [Backstage](https://backstage.io)

This is your newly scaffolded Backstage App, Good Luck!

To start the app, run:

```sh
yarn install
yarn start
```


# Backstage Locally Starting Command
```sh 
set -a; source .env; set +a && yarn start

```


# Backstage Azure docker image build and push command
```sh
docker build -t personalacr.azurecr.io/backstage:<version_name> .
azure login
az acr login --name personalacr
docker push personalacr.azurecr.io/backstage:<version_name>