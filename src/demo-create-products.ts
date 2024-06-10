import Stripe from 'stripe';
import { createStripe } from 'utils';

export const DEMO_PRICE_LOOKUP_KEYS = {
  basic: 'demo_basic_monthly',
  premiumYearly: 'demo_premium_yearly',
  premiumMonthly: 'demo_premium_monthly',
};

export const DEMO_PRODUCTS = [
  {
    name: 'Demo Basic',
    description: 'Demo Basic (Free) subscription',
    defaultPriceLookupKey: DEMO_PRICE_LOOKUP_KEYS.basic,
    prices: [
      {
        lookup_key: DEMO_PRICE_LOOKUP_KEYS.basic,
        unit_amount: 0,
        currency: 'aud',
        currency_options: {
          nzd: {
            unit_amount: 0,
          },
          usd: {
            unit_amount: 0,
          },
        },
        recurring: {
          interval: 'month',
        },
      },
    ],
  },
  {
    name: 'Demo Premium',
    description: 'Demo Premium subscription',
    defaultPriceLookupKey: DEMO_PRICE_LOOKUP_KEYS.premiumYearly,
    prices: [
      {
        lookup_key: DEMO_PRICE_LOOKUP_KEYS.premiumMonthly,
        unit_amount: 1000,
        currency: 'aud',
        currency_options: {
          nzd: {
            unit_amount: 1500,
          },
          usd: {
            unit_amount: 500,
          },
        },
        recurring: {
          interval: 'month',
        },
      },
      {
        lookup_key: DEMO_PRICE_LOOKUP_KEYS.premiumYearly,
        unit_amount: 10000,
        currency: 'aud',
        currency_options: {
          nzd: {
            unit_amount: 15000,
          },
          usd: {
            unit_amount: 5000,
          },
        },
        recurring: {
          interval: 'year',
        },
      },
    ],
  },
];

export async function demoCreateProducts() {
  const stripe = createStripe();

  const currentDemoProducts = await fetchDemoProducts(stripe);
  const currentDemoProductsNames = currentDemoProducts.map(({ name }) => name);

  if (
    DEMO_PRODUCTS.every(({ name }) => currentDemoProductsNames.includes(name))
  ) {
    console.log(`All products already exist: [${currentDemoProductsNames}]`);

    const demoPrices = await fetchDemoPrices(stripe);
    return { demoProducts: currentDemoProducts, demoPrices };
  }

  console.log('Creating Demo products...');
  const { demoPrices, demoProducts } = await createDemoProducts(stripe);

  return { demoPrices, demoProducts };
}

export async function fetchDemoProducts(stripe: Stripe) {
  const query = DEMO_PRODUCTS.map(({ name }) => `name:'${name}'`).join(' OR ');

  const products = await stripe.products.search({ query });

  return products.data;
}


export async function fetchDemoPrices(stripe: Stripe) {
  const prices = await stripe.prices.list({
    lookup_keys: Object.values(DEMO_PRICE_LOOKUP_KEYS),
    expand: ['data.product'],
  });

  return prices;
}

export async function createDemoProducts(stripe: Stripe) {
  for (const {
    name,
    description,
    prices: productPrices,
    defaultPriceLookupKey,
  } of DEMO_PRODUCTS) {
    const product = await stripe.products.create({
      name,
      description,
    });

    // crate all prices for the product and set the default product price
    for (const productPrice of productPrices) {
      const price = await stripe.prices.create({
        product: product.id,
        ...(productPrice as Stripe.PriceCreateParams),
      });

      // set the default price for the product
      if (price.lookup_key === defaultPriceLookupKey) {
        await stripe.products.update(product.id, {
          default_price: price.id,
        });
      }
    }
  }

  // fetch the created products and prices, redundant but for demo purposes
  const demoProducts = await fetchDemoProducts(stripe);
  const demoPrices = await fetchDemoPrices(stripe);

  return { demoProducts, demoPrices };
}
