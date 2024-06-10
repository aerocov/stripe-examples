import 'dotenv/config';

import { demoCreateProducts } from 'demo-create-products';
import { demoCancelSubscription } from 'demo-cancel-subscription';
import { demoCancelSubscriptionWithSchedule } from 'demo-cancel-subscription-with-schedule';
import { demoResumeSubscription } from 'demo-resume-subscription';

type Demo =
  | 'CreateProducts'
  | 'CancelSubscription'
  | 'CancelSubscriptionWithSchedule'
  | 'ResumeSubscription';

const demo: Demo =
  (process.argv[2] as Demo) || 'ResumeSubscription';

switch (demo) {
  case 'CreateProducts':
    console.log('Running demoCreateProducts...');
    demoCreateProducts().then(() => console.log('demoCreateProducts done!'));
    break;

  case 'CancelSubscription':
    console.log('Running demoCancelSubscription...');
    demoCancelSubscription().then(() =>
      console.log('demoCancelSubscription done!')
    );
    break;

  case 'CancelSubscriptionWithSchedule':
    console.log('Running demoCancelSubscriptionWithSchedule...');
    demoCancelSubscriptionWithSchedule().then(() =>
      console.log('demoCancelSubscriptionWithSchedule done!')
    );
    break;

  case 'ResumeSubscription':
    console.log('Running demoResumeSubscription...');
    demoResumeSubscription().then(() =>
      console.log('demoResumeSubscription done!')
    );
    break;

  default:
    console.error('Invalid demo');
}
