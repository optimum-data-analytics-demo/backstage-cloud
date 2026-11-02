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


<!-- # Backstage Azure docker image build and push command
```sh
docker build -t personalacr.azurecr.io/backstage:<version_name> .
azure login
az acr login --name personalacr
docker push personalacr.azurecr.io/backstage:<version_name>
```
 -->
## Environment Variables

Copy `.env.example` to `.env` and fill in the values before starting the app. Never commit `.env` or share its secrets.

| Variable | Required | Description |
|---|---|---|
| `CONTAINER_NAME` | Yes | Name of the Azure Blob Storage container that holds the built TechDocs sites and the synced catalog files. |
| `ACCOUNT_NAME` | Yes | Name of the Azure Storage account that contains the container. |
| `AZURE_STORAGE_ACCOUNT_KEY` | Yes | Access key for the storage account. Treat it as a secret. |
| `APP_TITLE` | No | Title shown in the portal header and browser tab. |
| `ORG_NAME` | No | Organization name shown in the portal. |
| `APP_BASE_URL` | Yes | Public URL of the frontend, for example `http://localhost:3000`. Also used for CORS, so it must match the URL in the browser. |
| `BACKEND_URL` | Yes | URL of the Backstage backend, for example `http://localhost:7007`. |
| `GITHUB_TOKEN` | Yes | GitHub token used by the Software Template to create repositories. See the permissions below. |
| `GITHUB_ORGANIZATION_NAME` | Yes | GitHub organization in which new repositories are created. |

### GitHub token permissions

Use a fine-grained personal access token (or a GitHub App) with the organization as its resource owner and access to all repositories:

| Permission | Level | Why |
|---|---|---|
| Administration | Read and write | Create the repository |
| Contents | Read and write | Push the generated files |
| Workflows | Read and write | Push `.github/workflows/push_docs.yaml` |
| Metadata | Read | Required by default |

Set an expiry date on the token and renew it before it expires, otherwise repository creation fails with a 401 or 403 error.



### Docker Image Building

- Install the exact same dependency versions that were tested
    ```sh
        yarn install --immutable
    ```
-   Check any mistakes are in typescript code before building docker image
    ```sh 
        yarn tsc 
    ```

- Compile backend code and check any error is present or not.
    
    ```sh 
        yarn build:backend
    ```
- Docker Image build command
    ```sh
        docker image build . -f packages/backend/Dockerfile --tag odapocacr.azurecr.io/backstage:<tag>
    ```