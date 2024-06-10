import moment from 'moment';
import { customAlphabet, urlAlphabet } from 'nanoid';
import Stripe from 'stripe';

export function createStripe() {
  return new Stripe(process.env.STRIPE_API_KEY || '');
}

export function generateRunId() {
  const nanoid = customAlphabet(urlAlphabet, 5);
  return nanoid();
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AnyObject = { [key: string]: any };

export function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map(cleanObject)
      .filter((item) => item != null && item !== '');
    return cleanedArray.length > 0 ? cleanedArray : null;
  } else if (typeof obj === 'object' && obj !== null) {
    const cleanedObj: AnyObject = {};
    Object.keys(obj).forEach((key) => {
      const value = cleanObject(obj[key]);
      if (
        value != null &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        cleanedObj[key] = value;
      }
    });
    return Object.keys(cleanedObj).length > 0 ? cleanedObj : null;
  } else {
    return obj;
  }
}

export function calculateRemainingMonthsToAnnualRenewal(
  start: Date | string,
  cancel: Date | string
) {
  const startDate = moment(start);
  const cancelDate = moment(cancel);
  const annualRenewalDate = startDate.clone().add(1, 'year');

  const remainingMonthsBeforeCancellation = annualRenewalDate.diff(
    cancelDate,
    'months'
  );

  return {
    remainingMonthsBeforeCancellation,
    annualRenewalDate: annualRenewalDate.toDate(),
  };
}

/**
 *
 * This function creates a customer with a default payment method
 * and then creates a subscription for the customer using the given price lookup key.
 *
 * https://docs.stripe.com/api/subscriptions/create#create_subscription-collection_method
 * https://docs.stripe.com/api/subscriptions/create#create_subscription-payment_behavior
 *
 */
export async function createSubscription({
  stripe,
  priceLookupKey,
  name,
  email,
  subscriptionParams = {},
  metadata,
  testClockId,
}: {
  stripe: Stripe;
  priceLookupKey: string;
  name: string;
  email: string;
  subscriptionParams?: Omit<Stripe.SubscriptionCreateParams, 'customer'>;
  metadata?: any;
  testClockId?: string;
}) {
  const customer = await createCustomer(
    stripe,
    name,
    email,
    metadata,
    testClockId
  );

  const prices = await stripe.prices.list({
    lookup_keys: [priceLookupKey],
    expand: ['data.product'],
  });

  const price = prices.data[0];

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    collection_method: 'charge_automatically',
    payment_behavior: 'error_if_incomplete',
    automatic_tax: {
      enabled: true,
    },
    items: [{ price: price!.id }],
    metadata,
    ...subscriptionParams,
  });

  return { subscription, customer, price };
}

/**
 * This function creates a customer with a test payment method.
 * It also attaches a test clock to the customer for simulation purposes.
 *
 * To use actual card data, the raw card data APIs must be enabled,
 * which requires some level of PCI DSS compliance. We use test payment methods.
 *
 * https://docs.stripe.com/testing?testing-method=payment-methods#cards
 * https://support.stripe.com/questions/enabling-access-to-raw-card-data-apis
 *
 */
export async function createCustomer(
  stripe: Stripe,
  name: string,
  email: string,
  metadata: any,
  testClockId?: string
) {
  const customer = await stripe.customers.create({
    name,
    email,
    address: {
      country: 'AU',
      city: 'Sydney',
    },
    shipping: {
      address: {
        country: 'AU',
        city: 'Sydney',
      },
      name,
    },
    payment_method: 'pm_card_visa',
    invoice_settings: {
      default_payment_method: 'pm_card_visa',
    },
    metadata,
    ...(testClockId && { test_clock: testClockId }),
  });

  return customer;
}

export async function waitForSubscriptionStatus(
  stripe: Stripe,
  subscriptionId: string,
  expectedStatus: string
) {
  let count = 1;
  const maxPollCount = 60;

  let subscription = await stripe.subscriptions.retrieve(subscriptionId);

  while (subscription.status !== expectedStatus && ++count < maxPollCount) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log(
      `checking subscription.status=${subscription.status}...${count}`
    );
    await sleep(2000);
  }

  if (count >= maxPollCount) {
    console.log(
      `the expected status was not met after ${count} polls. subscription=${JSON.stringify(
        subscription
      )}`
    );

    return subscription;
  }

  console.log(`subscription is ${subscription.status} after ${count} polls.`);

  return subscription;
}

export async function createTestClock(stripe: Stripe, name: string) {
  return stripe.testHelpers.testClocks.create({
    frozen_time: moment().unix(),
    name,
  });
}

/**
 * This function advances the test clock by the given number of days, weeks, months, and years.
 * You can advance a test clock not more than two intervals in the future from the shortest subscription in the test clock.
 *
 * https://docs.stripe.com/api/test_clocks/advance
 *
 */
export async function advanceClockBy(
  stripe: Stripe,
  testClockId: string,
  {
    days = 0,
    weeks = 0,
    months = 0,
    years = 0,
  }: { days?: number; weeks?: number; months?: number; years?: number }
) {
  const clock = await stripe.testHelpers.testClocks.retrieve(testClockId);
  const current = moment.unix(clock.frozen_time);
  const target = moment(current)
    .add(years, 'years')
    .add(months, 'months')
    .add(weeks, 'weeks')
    .add(days, 'days');

  console.log(`advancing clock to ${target.toDate()}...`);

  await stripe.testHelpers.testClocks.advance(testClockId, {
    frozen_time: target.unix(),
  });

  await waitForClockToAdvance(stripe, testClockId);
}

export async function advanceClockTo(
  stripe: Stripe,
  testClockId: string,
  date: Date,
  shortestInterval: 'day' | 'week' | 'month' | 'year' = 'month'
) {
  const clock = await stripe.testHelpers.testClocks.retrieve(testClockId);
  const current = moment.unix(clock.frozen_time);

  // adding some time to the exact target date to account for inaccuracies
  const target = moment(date).add(5, 'minutes');

  const intervalUnit = `${shortestInterval}s` as moment.unitOfTime.Diff;
  const intervals = target.diff(current, intervalUnit);

  // first advance by the number of the shortest interval needed to reach the target date
  for (let i = 0; i < intervals; i++) {
    await advanceClockBy(stripe, testClockId, { [intervalUnit]: 1 });
  }

  // then advance to the exact date to compensate for rounding errors
  await stripe.testHelpers.testClocks.advance(testClockId, {
    frozen_time: target.unix(),
  });

  // wait for the clock to be ready
  await waitForClockToAdvance(stripe, testClockId);
}

export async function waitForClockToAdvance(
  stripe: Stripe,
  testClockId: string,
  maxPollCount = 400
) {
  let clock = await stripe.testHelpers.testClocks.retrieve(testClockId);
  let count = 0;
  while (clock.status !== 'ready' && ++count < maxPollCount) {
    clock = await stripe.testHelpers.testClocks.retrieve(testClockId);
    console.log(`checking clock.status=${clock.status}...${count}`);
  }

  const clockData = JSON.stringify({
    frozen_time: clock.frozen_time,
    status: clock.status,
    created: clock.created,
  });

  if (count >= maxPollCount) {
    throw new Error(
      `clock is not ready after ${count} polls. clockData=${clockData}`
    );
  }

  console.log(
    `clock is ready after ${count} polls. clockData=${clockData}\n\n`
  );
}
