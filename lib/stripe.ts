// Mock stripe client since payment is disabled for this internal deployment
export const stripe = {
  checkout: {
    sessions: {
      create: async () => ({ url: "/dashboard" }),
      retrieve: async () => ({ customer: "mock_cust_internal_auto" })
    }
  }
} as any;

