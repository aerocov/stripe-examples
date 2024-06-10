/**
 * To receive events locally from Stripe, use the Stripe CLI to forward events to this endpoint:
 *
 * $ stripe login
 * $ stripe listen --forward-to localhost:4242/webhook
 *
 * To trigger a test event:
 *
 * $ stripe trigger payment_intent.succeeded
 */
import 'dotenv/config';
import Stripe from 'stripe';
import express from 'express';

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const stripeApiKey = process.env.STRIPE_API_KEY;

const stripe = new Stripe(stripeApiKey);
const app = express();

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (request, response) => {
    const signature = request.headers['stripe-signature'] || '';

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(err);
      response.status(400).send(`Webhook Error: ${(err as Error).message}`);
      return;
    }

    const {
      type: eventType,
      data: { object: eventData },
    } = event;

    console.log('event type: ', eventType);

    switch (eventType) {
      case 'payment_intent.succeeded':
        // do nothing
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'subscription_schedule.created':
      case 'subscription_schedule.updated':
      case 'subscription_schedule.canceled':
      case 'subscription_schedule.released':
        console.log('event data: ', JSON.stringify(eventData, null, 2));
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // response 200 to acknowledge receipt of the event
    response.send();
  }
);

app.listen(4242, () => console.log('Running on port 4242'));
