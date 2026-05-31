import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

/**
 * Sends an OTP email to a newly enrolled student.
 * Requires EmailJS env vars to be set in .env
 * Template variables: to_name, to_email, reg_number, otp_code, expiry_hours, school_name
 */
export async function sendOtpEmail({ studentName, email, regNumber, otpCode, expiryHours = 24 }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('EmailJS credentials are not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env')
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_name:      studentName,
      to_email:     email,
      reg_number:   regNumber,
      otp_code:     otpCode,
      expiry_hours: expiryHours,
      school_name:  'Oasis Private College',
    },
    PUBLIC_KEY,
  )
}
