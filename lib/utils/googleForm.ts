/**
 * Build a pre-filled Google Form URL with the product name
 * @param productName - The name of the product to pre-fill
 * @returns The complete Google Form URL with query parameters
 *
 * NOTE: You need to identify the correct entry ID for your Google Form's product name field
 * 1. Open your Google Form
 * 2. Right-click on the product name field and select "Inspect"
 * 3. Find the name attribute like: name="entry.123456789"
 * 4. Replace 'entry.123456789' below with your actual entry ID
 */
export function buildOrderFormUrl(productName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || ''

  // TODO: Replace 'entry.123456789' with your actual Google Form entry ID
  // To find it: Inspect your form's product name field HTML
  const params = new URLSearchParams({
    'entry.123456789': productName, // ← REPLACE THIS with your actual entry ID
  })

  return `${baseUrl}&${params.toString()}`
}
