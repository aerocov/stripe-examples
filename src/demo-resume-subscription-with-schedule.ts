import { DEMO_PRICE_LOOKUP_KEYS } from 'demo-create-products';
import moment from 'moment';
import Stripe from 'stripe';
import {
  advanceClockBy,
  advanceClockTo,
  calculateRemainingMonthsToAnnualRenewal,
  cleanObject,
  createStripe,
  createSubscription,
  createTestClock,
  generateRunId,
  sleep,
  waitForSubscriptionStatus,
} from 'utils';

/**
 *
 * In this demo, we want to show how to resume a subscription after it has been canceled through a schedule.
 *
 * 1. create a customer and a monthly subscription for them.
 * 2. customer requests to cancel the subscription one month and 15 days after creation.
 * 3. advance the clock to the cancellation date.
 * 4. calculate the remaining months before the annual renewal date.
 * 5. migrate the subscription to a subscription schedule.
 * 6. update the schedule to cancel the subscription after the remaining months, invoicing the customer each month.
 * 7. advance the clock by a couple of months.
 * 8. resume the subscription by releasing the schedule, not preserving the cancel date.
 * 9. advance the clock to the annual renewal date.
 * 10. advance three more months to see if the subscription is still active.
 * 11. retrieves the subscription to check the status.
 * 12. retrieves the invoices paid by the customer.
 *
 */
export async function demoResumeSubscriptionWithSchedule() {
  const stripe = createStripe();
  const runId = generateRunId();

  const name = `Hoss Monthly ${runId}`;
  const email = `hoss+m${runId}@aerocov.dev`;

  // create a test clock
  const testClock = await createTestClock(stripe, name);

  // subscription details
  const subscriptionSpecs = {
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

  // calculate the remaining months before cancellation, cancelling 1 month and 15 days after the start date
  const start = moment.unix(subscription.start_date);
  const cancel = start.clone().add(0, 'years').add(1, 'months').add(15, 'days');

  const { annualRenewalDate, remainingMonthsBeforeCancellation, error } =
    calculateRemainingMonthsToAnnualRenewal(start.toDate(), cancel.toDate());

  if (!annualRenewalDate) {
    throw new Error(error);
  }

  // advance the clock to the cancellation date
  await advanceClockTo(stripe, testClock.id, cancel.toDate());

  // migrate the existing subscription to be managed by a subscription schedule.
  //
  // note:
  // when creating a schedule from a subscription, the schedule will inherit the subscription's default settings
  // also not possible to update anything in the first call, so updates to the schedule will be done in a separate call(s)
  let scheduledSubscription = await stripe.subscriptionSchedules.create({
    from_subscription: subscription.id,
  });

  // updating the schedule to cancel the subscription after the remaining months
  // 1. extract the first phase (default) of the schedule to be used in the update call
  // 2. create a new phase that will exhaust and bill the remaining months before cancellation
  // 3. update the schedule with the default and exhaustion phases
  //
  // note:
  // there are null values in the default phase (phase[0]) object because they are inherited from the subscription default_settings
  // they need to be removed when used with the update call, otherwise the update will fail, hence the cleanObject function
  // https://docs.stripe.com/billing/subscriptions/subscription-schedules#phase-attribute-inheritance

  // 1. extract phase_0 and remove null values
  const defaultPhase: Stripe.SubscriptionScheduleUpdateParams.Phase =
    cleanObject(scheduledSubscription.phases[0]);

  const phases = [defaultPhase];

  // 2. create the exhaustion phase if there are remaining months before cancellation
  if (remainingMonthsBeforeCancellation > 0) {
    const exhaustionPhase: Stripe.SubscriptionScheduleUpdateParams.Phase = {
      items: [
        {
          price: subscription.items.data[0].price.id,
        },
      ],
      iterations: remainingMonthsBeforeCancellation,
    };

    phases.push(exhaustionPhase);
  }

  // 3. update the schedule with the default and exhaustion phases
  scheduledSubscription = await stripe.subscriptionSchedules.update(
    scheduledSubscription.id,
    {
      end_behavior: 'cancel',
      phases,
    }
  );

  // advance the clock by a couple of months, 
  // note this must be before the annual renewal date where the subscription will be cancelled
  await advanceClockBy(stripe, testClock.id, { months: 2 });

  // resume the subscription by releasing the schedule, not preserving the cancel date
  scheduledSubscription = await stripe.subscriptionSchedules.release(
    scheduledSubscription.id,
    { preserve_cancel_date: false }
  );

  if (scheduledSubscription.status !== 'released') {
    console.error('Scheduled subscription not released');
    return;
  }

  // advance the clock the annual renewal date
  await advanceClockTo(stripe, testClock.id, annualRenewalDate);

  // advance three more months to see if the subscription is still active
  await advanceClockBy(stripe, testClock.id, { months: 1 });
  await advanceClockBy(stripe, testClock.id, { months: 1 });
  await advanceClockBy(stripe, testClock.id, { months: 1 });

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
    start: start.toDate(),
    cancel: cancel.toDate(),
    annualRenewalDate: annualRenewalDate,
    remainingMonthsBeforeCancellation,
    subscriptionId: updatedSubscription.id,
    subscriptionStatus: updatedSubscription.status,
    scheduledSubscriptionStatus: scheduledSubscription.status,
    lastInvoice: updatedSubscription.latest_invoice,
    noOfInvoicesPaid: invoices.data.filter((i) => i.paid).length,
  });

  // deleting a test clock will delete all resources associated with it, so it could give false positives when testing.
  // await stripe.testHelpers.testClocks.del(testClock.id);

  return {
    subscription,
    scheduledSubscription,
    remainingMonthsBeforeCancellation,
  };
}
