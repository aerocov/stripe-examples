import { DEMO_PRICE_LOOKUP_KEYS } from 'demo-create-products';
import moment from 'moment';
import {
  SubscriptionSpecs,
  advanceClockBy,
  advanceClockTo,
  createStripe,
  createSubscription,
  createTestClock,
  generateRunId,
  waitForSubscriptionStatus,
} from 'utils';

/**
 *
 * In this demo, we want to show how to resume a subscription after it has been canceled.
 *
 * The simulation is as follows:
 *
 * 1. create a customer and a monthly subscription for them.
 * 2. cancel the subscription at the end of the current period.
 * 3. advance the clock by a couple of days.
 * 4. resume the subscription by updating the subscription.
 * 5. advance the clock to the cancellation date.
 * 6. retrieve the subscription and the invoices paid by the customer.
 *
 */
export async function demoResumeSubscription() {
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

  const start = moment.unix(subscription.current_period_start).toDate();
  const end = moment.unix(subscription.current_period_end).toDate();

  // cancel the subscription at the end of the current period
  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  // advance the clock by a couple of days
  await advanceClockBy(stripe, testClock.id, { days: 2 });

  // resume by updating the subscription
  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: false,
  });

  // advance the clock to the cancellation date
  await advanceClockTo(stripe, testClock.id, end);

  // assert the subscription to be active
  const updatedSubscription = await waitForSubscriptionStatus(
    stripe,
    subscription.id,
    'active'
  );

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
