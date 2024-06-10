declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STRIPE_API_KEY: string;
      STRIPE_ENDPOINT_SECRET: string;
      STRIPE_ENDPOINT_PORT: string;
    }
  }
}

export {};
