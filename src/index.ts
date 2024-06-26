import 'dotenv/config';

import { demoCancelSubscription } from 'demo-cancel-subscription';
import { demoCancelSubscriptionWithSchedule } from 'demo-cancel-subscription-with-schedule';
import { demoCreateProducts } from 'demo-create-products';
import { demoResumeSubscription } from 'demo-resume-subscription';
import { demoResumeSubscriptionWithSchedule } from 'demo-resume-subscription-with-schedule';
import { demoCancelSubscriptionNoWithCancelAt } from 'demo-cancel-subscription-with-cancel-at';

type Demo =
  | 'create-products'
  | 'cancel-subscription'
  | 'cancel-subscription-with-schedule'
  | 'resume-subscription'
  | 'resume-subscription-with-schedule'
  | 'cancel-subscription-with-cancel-at';

const demo: Demo =
  (process.argv[2] as Demo) || 'cancel-subscription-with-cancel-at';

switch (demo) {
  case 'create-products':
    console.log('Running demoCreateProducts...');
    demoCreateProducts().then(() => console.log('demoCreateProducts done!'));
    break;

  case 'cancel-subscription':
    console.log('Running demoCancelSubscription...');
    demoCancelSubscription().then(() =>
      console.log('demoCancelSubscription done!')
    );
    break;

  case 'cancel-subscription-with-schedule':
    console.log('Running demoCancelSubscriptionWithSchedule...');
    demoCancelSubscriptionWithSchedule().then(() =>
      console.log('demoCancelSubscriptionWithSchedule done!')
    );
    break;

  case 'resume-subscription':
    console.log('Running demoResumeSubscription...');
    demoResumeSubscription().then(() =>
      console.log('demoResumeSubscription done!')
    );
    break;

  case 'resume-subscription-with-schedule':
    demoResumeSubscriptionWithSchedule().then(() =>
      console.log('demoResumeSubscriptionWithSchedule done!')
    );
    break;

  case 'cancel-subscription-with-cancel-at':
    console.log('Running demoCancelSubscriptionNoWithCancelAt...');
    demoCancelSubscriptionNoWithCancelAt().then(() =>
      console.log('demoCancelSubscriptionNoWithCancelAt done!')
    );
    break;

  default:
    console.error('Invalid demo');
}
