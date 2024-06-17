import { DEMO_PRICE_LOOKUP_KEYS } from 'demo-create-products';
import moment from 'moment';
import {
  SubscriptionSpecs,
  advanceClockBy,
  advanceClockTo,
  calculateRemainingMonthsToAnnualRenewal,
  createStripe,
  createSubscription,
  createTestClock,
  generateRunId,
  waitForSubscriptionStatus,
} from 'utils';

/**
 * In this demo, we want to show how to cancel a subscription at an arbitrary future date.
 *
 * The simulation is as follows:
 * 1. create a customer and a monthly subscription for them.
 * 2. cancel the subscription at a future date using the `cancel_at` parameter.
 * 3. advance the clock to the future date defined above.
 * 4. assert the subscription is cancelled.
 * 5. retrieve subscription and invoices data.
 *
 */
export async function demoCancelSubscriptionNoWithCancelAt() {
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
    subscriptionParams: {
      proration_behavior: 'none',
    },
  };

  // create a subscription
  const { subscription } = await createSubscription(subscriptionSpecs);

  // request cancellation at some point in the future
  const start = moment.unix(subscription.start_date);
  const cancel = start.clone().add(0, 'years').add(1, 'months').add(10, 'days');

  // calculate the remaining months before the annual renewal date
  const { annualRenewalDate, remainingMonthsBeforeCancellation, error } =
    calculateRemainingMonthsToAnnualRenewal(start.toDate(), cancel.toDate());

  if (!annualRenewalDate) {
    throw new Error(error);
  }

  // advance the clock to the cancellation request date
  await advanceClockTo(stripe, testClock.id, cancel.toDate());

  // cancel the subscription at the annual renewal date, a future cancellation using `cancel_at`
  const cancelAt = moment(annualRenewalDate).unix();
  await stripe.subscriptions.update(subscription.id, {
    cancel_at: cancelAt,
  });

  // advance the clock by two months, the subscription should still be active
  await advanceClockBy(stripe, testClock.id, { months: 2 });

  // assert that the subscription is canceled
  let updatedSubscription = await waitForSubscriptionStatus(
    stripe,
    subscription.id,
    'active'
  );

  // advance the clock the annual renewal date
  await advanceClockTo(stripe, testClock.id, annualRenewalDate);

  // assert that the subscription is canceled
  updatedSubscription = await waitForSubscriptionStatus(
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
    cancel,
    cancelAt,
    subscriptionStatus: updatedSubscription.status,
    lastInvoice: updatedSubscription.latest_invoice,
    noOfInvoicesPaid: invoices.data.filter((i) => i.paid).length,
  });

  return {
    subscription,
  };
}
