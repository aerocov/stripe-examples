# Stripe examples

This repository contains some end-to-end simulation of real-world usage of Stripe.
All demos need a list of products and prices to work, which are created by the `create-products` demo.

Each demo is a standalone script that can be run independently. A test clock is used to simulate the passage of time.

## How to run the demos

```sh
# create a .env and update with your stripe credentials
cp .env.example .env

# install dependencies
yarn install

# create the required  stripe products and prices
yarn start create-products

# run a demo by name
yarn start resume-subscription
```

## Available Demos

| Demo Name                            | Description                                                |
| ------------------------------------ | ---------------------------------------------------------- |
| `create-products`                    | Create Products and Prices required for other demos.       |
| `cancel-subscription`                | Cancel a subscription at the end of the billing period     |
| `cancel-subscription-with-schedule`  | Cancel a subscription using a subscription schedule        |
| `cancel-subscription-with-cancel-at` | Cancel a subscription at a later date                      |
| `resume-subscription`                | Resume a cancelled subscription                            |
| `resume-subscription-with-schedule`  | Resume a subscription that is cancelled through a schedule |

## Webhook Handler

The webhook handler is a simple express server that listens for Stripe events and logs them to the console. To run the webhook handler:

```sh
# install stripe cli
# https://docs.stripe.com/stripe-cli
brew install stripe/stripe-cli/stripe

# start the webhook handler
yarn dev:webhook

# in another terminal, forward the webhook events to the local server
stripe login
stripe listen --forward-to localhost:4242/webhook
```
