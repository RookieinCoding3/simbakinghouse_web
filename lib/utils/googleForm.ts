/**
 * Google Form URL for Sim Baking House orders
 * Direct link - no pre-filling needed as form is simple and user will select product manually
 */
export const GOOGLE_FORM_URL = 'https://forms.gle/AufdJFLrqhPzSh61A'

export function buildOrderFormUrl(productName?: string): string {
  // Return direct form URL - product selection happens within the form
  return GOOGLE_FORM_URL
}
