import 'dotenv/config';

import { demoCancelSubscription } from 'demo-cancel-subscription';
import { demoCancelSubscriptionWithSchedule } from 'demo-cancel-subscription-with-schedule';
import { demoCreateProducts } from 'demo-create-products';
import { demoResumeSubscription } from 'demo-resume-subscription';
import { demoResumeSubscriptionWithSchedule } from 'demo-resume-subscription-with-schedule';

type Demo =
  | 'CreateProducts'
  | 'CancelSubscription'
  | 'CancelSubscriptionWithSchedule'
  | 'ResumeSubscription'
  | 'ResumeSubscriptionWithSchedule';

const demo: Demo = (process.argv[2] as Demo) || 'ResumeSubscriptionWithSchedule';

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

  case 'ResumeSubscriptionWithSchedule':
    demoResumeSubscriptionWithSchedule().then(() =>
      console.log('demoResumeSubscriptionWithSchedule done!')
    );
    break;

  default:
    console.error('Invalid demo');
}
