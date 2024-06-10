import 'dotenv/config';

import { demoCreateProducts } from 'demo-create-products';
import { demoCancelSubscription } from 'demo-cancel-subscription';

type Demo = 'CreateProducts' | 'CancelSubscription';

const demo: Demo = (process.argv[2] as Demo) || 'CancelSubscription';

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

  default:
    console.error('Invalid demo');
}
