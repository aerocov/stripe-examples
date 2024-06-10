import 'dotenv/config';

import { demoCreateProducts } from 'demo-create-products';
import { demoCancelSubscription } from 'demo-cancel-subscription';
import { demoCancelSubscriptionWithSchedule } from 'demo-cancel-subscription-with-schedule';

type Demo =
  | 'CreateProducts'
  | 'CancelSubscription'
  | 'CancelSubscriptionWithSchedule';

const demo: Demo = (process.argv[2] as Demo) || 'CancelSubscriptionWithSchedule';

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

  default:
    console.error('Invalid demo');
}
