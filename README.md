# Podcast Community Api

- [Podcast Community Api](#podcast-community-api)
  - [Sites](#sites)
  - [Setup](#setup)
  - [Development](#development)
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
