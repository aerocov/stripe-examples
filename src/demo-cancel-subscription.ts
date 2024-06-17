import { DEMO_PRICE_LOOKUP_KEYS } from 'demo-create-products';
import moment from 'moment';
import {
  SubscriptionSpecs,
  advanceClockTo,
  createStripe,
  createSubscription,
  createTestClock,
  generateRunId,
  waitForSubscriptionStatus,
} from 'utils';


/**
 * In this demo, we want to show how to cancel a subscription. 
 * 
 * The simulation is as follows:
 * 1. create a customer and a monthly subscription for them.
 * 2. cancel the subscription at the end of the current period.
 * 3. advance the clock to the end of the billing period.
 * 4. assert the subscription is cancelled.
 * 5. retrieve subscription and invoices data.
 * 
 */
export async function demoCancelSubscription() {
  const stripe = createStripe();
  const runId = generateRunId();
  
  const name = `Hoss Monthly ${runId}`;
  const email = `hoss+m${runId}@aerocov.dev`;

  // create a test clock
  const testClock = await createTestClock(stripe, name);

  // subscription details
  const subscriptionSpecs: SubscriptionSpecs = {
    stripe,
    priceLookupKey: DEMO_PRICE_LOOKUP_KEYS.premiumMonthly,
    name,
    email,
    metadata: {
      runId,
    },
    testClockId: testClock.id,
  };

  // create a subscription
  const { subscription } = await createSubscription(subscriptionSpecs);

  // get the start and end dates of the current period
  const start = moment.unix(subscription.current_period_start).toDate();
  const end = moment.unix(subscription.current_period_end).toDate();

  // cancel the subscription at the end of the current period
  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  // advance the clock to the cancellation date
  await advanceClockTo(stripe, testClock.id, end);

  // assert that the subscription is canceled
  const updatedSubscription = await waitForSubscriptionStatus(
    stripe,
    subscription.id,
    'canceled'
  );

  // get all invoices for the subscription
  const invoices = await stripe.invoices.list({
    subscription: updatedSubscription.id,
    limit: 100,
  });

  console.log({
    name,
    email,
    start,
    end,
    subscriptionStatus: updatedSubscription.status,
    lastInvoice: updatedSubscription.latest_invoice,
    noOfInvoicesPaid: invoices.data.filter((i) => i.paid).length,
  });

  return {
    subscription,
  };
}
