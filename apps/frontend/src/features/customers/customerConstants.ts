export const CUSTOMER_TAB_LABELS = {
  assigned: 'Target Customers',
  inactive: 'App Funnel',
  high: 'Priority Customers'
} as const;

export type CustomerTabType = keyof typeof CUSTOMER_TAB_LABELS;
