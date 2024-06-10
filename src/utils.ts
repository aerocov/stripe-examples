import Stripe from 'stripe';

export function createStripe() {
  return new Stripe(process.env.STRIPE_API_KEY || '');
}
