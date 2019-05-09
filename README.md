# Podcast Community Api

- [Podcast Community Api](#podcast-community-api)
  - [Sites](#sites)
  - [Setup](#setup)
  - [Development](#development)
    - [Mirgations](#mirgations)
    - [Linting](#linting)
      - [Workspace Settings](#workspace-settings)
      - [Flow](#flow)
      - [Husky](#husky)
  - [Usage](#usage)

## Sites

* [api](https://thru.the.ether-api.sebastiangerstelsollerman.me/) (slash redirects to docks)
* [api-dev](https://dev.thru.the.ether-api.sebastiangerstelsollerman.me/) (slash redirect to docks)


## Setup

This app is setup to run in a docker container initiated from the main repo
but before you do that you need to run `cp .env.dist .env` and then set your JWT_SECRET (same as client) and add your X_LISTENAPI_KEY
instructions on how to get your own listennotes key kan be found [her](https://www.listennotes.com/api/).

Once you have all this setup you go to the [main repo](https://github.com/SebastianGerS/podcast-community) and follow the instructions there.

Note that it's possible to run this application just bye using:

`yarn`
`yarn start` 

or

`npm install`
`npm run start`

But you will have to configure and set up your own mongodb if you chose to do so


## Development

Any change should trigger a restart of nodemon in the container (same if your just using `yarn start`)

### Mirgations
Migrations can be created and run with `yarn md-seed run` inside the container note that new sedders should be added to the /seeders directory and imported into the md-seed-config.js note that the paths for imports should start with `../dist/` this is importent since we need to run the transpield versions of the src files to run this on the server, this also means that you will need to run `yarn build` localy before running the seeders (and re run that comand if any changes that your seeders are effected bye has been made in src).

Also note that if you are runing the docker containers with production settings (using `Dockerfile_Prod` and `docker-compose.yml`) you will need to run both `yarn build-seeders` and `yarn build-seeder-conf` before building the containers this creates transpield versions of the fiels that `Dockerfile_Prod` will copy into the container

For more instructions on how to write a seeder take a look at [md-seed](https://github.com/sharvit/mongoose-data-seed#readme)

### Linting


#### Workspace Settings

Workspace settings found in .vscode/settings.json
If you are not using vs code please add corresponding settings for your editor.
It's also recomended to install the folowing plugins for vs code:

ESLint
Prettier
Flow Language Suport

These plugins allong with the workspace settings will help you to auto-format
you code on save as well as give you tipps on how to writ better code

#### Flow
To install flow on your machine:
brew install flow (for mac & linux)
npm install --global flow-bin (for windows)

#### Husky
Precommit-hook added which runs eslint to check that the linting rules are beeing followed,
if there are any errors you will be forced to fix them befor you commit

## Usage

* [Documentation](https://documenter.getpostman.com/view/3252976/RWgnWzKb#intro)
