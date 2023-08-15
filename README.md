# Web Regression Analysis

## Project Overview

The purpose of this project is to analyze the performance of a website before and after a change.

## Packages

### App

Runtime application code for the Regression Analysis lambda.

Its responsibility is to:

1. Get a URL
2. Open headless chrome
3. Start a CDP session
4. Navigate to the URL
5. Wait for the page to load
6. Collect performance metrics

#### Developing

1. Edit `index.ts` file
2. Run `npm run build`

#### Publishing

1. Change directories to `../infra`
2. `cdk deploy`

### Infra

Infrastructure as code for the Regression Analysis lambda.

Its responsibility is to:

1. Create an S3 bucket to store the runtime code and chrome binary
2. Create a lambda function
3. Create a role for the lambda function that allows it to read the chrome binary from S3

#### Developing

1. Edit `lib/poc-stack.ts` file
2. Run `npm run build`

### Github Action (.github/actions/ra)

Github action to run the Regression Analysis lambda when a pull request is opened/updated.

Its responsibility is to:

1. Send URL to the lambda function
2. Get the results from the lambda function
3. Post the results as a comment on the pull request

#### Developing

1. Edit `/src/main.ts`
2. Run `npm run all`, this will build, package, and test the action
