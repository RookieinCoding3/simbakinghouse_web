// Single source of truth for Sim Baking House's base URL, contact details and
// opening hours. Update here only — every page/component/metadata block should
// import from this file rather than hardcoding these values.

export const SITE_URL = 'https://www.simbakinghouse.com.my'

export const CONTACT_PHONE_NUMBER = '60128664836'
export const CONTACT_PHONE_DISPLAY = '+60 12-866 4836'
export const CONTACT_PHONE_E164 = `+${CONTACT_PHONE_NUMBER}`
export const CONTACT_EMAIL = 'simbakinghouse25@gmail.com'

// The shop has no landline: this number is WhatsApp-only, so there is
// deliberately no tel: link.
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE_NUMBER}`
export const CONTACT_MAILTO_URL = `mailto:${CONTACT_EMAIL}`

export const SHOP_OPENS_AT = '6:30 AM'
export const SHOP_CLOSES_AT = '1:00 PM'
export const OPENING_HOURS = `Daily: ${SHOP_OPENS_AT} - ${SHOP_CLOSES_AT}`

export const absoluteUrl = (path = '/') => `${SITE_URL}${path}`
