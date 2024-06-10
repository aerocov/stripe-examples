import 'dotenv/config';

import { demoCreateProducts } from 'demo-create-products';

type Demo = 'CreateProducts';

const demo: Demo = (process.argv[2] as Demo) || 'CreateProducts';

switch (demo) {
  case 'CreateProducts':
    console.log('Running demoCreateProducts...');
    demoCreateProducts().then(() => console.log('demoCreateProducts done!'));
    break;

  default:
    console.error('Invalid demo');
}
