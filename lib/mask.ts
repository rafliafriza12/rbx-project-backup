/**
 * Server-side masking utilities.
 * Apply these on the API layer so clients never receive raw PII.
 */

/** Generic masker: keeps `visibleChars` at start and end, replaces the middle with `*` */
export function maskString(str: string, visibleChars: number = 2): string {
  if (!str) return str;
  if (str.length <= visibleChars * 2) return "*".repeat(str.length);
  return (
    str.slice(0, visibleChars) +
    "*".repeat(str.length - visibleChars * 2) +
    str.slice(-visibleChars)
  );
}

/** ra***@gmail.com */
export function maskEmail(email: string): string {
  if (!email) return email;
  const atIdx = email.indexOf("@");
  if (atIdx === -1) return maskString(email);
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  if (!domain) return maskString(email);
  return maskString(local, 2) + "@" + maskString(domain, 2);
}

/** 08123456789 → 0812****6789 */
export function maskPhone(phone: string): string {
  if (!phone) return phone;
  if (phone.length <= 6) return maskString(phone, 3);
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

/** player123 → pl*****23 */
export function maskUsername(username: string): string {
  if (!username || username.length <= 3) return username;
  if (username.length <= 5)
    return username.slice(0, 1) + "***" + username.slice(-1);
  return (
    username.slice(0, 2) + "*".repeat(username.length - 4) + username.slice(-2)
  );
}

/** Mask a display name: John Doe → Jo** Do* */
export function maskName(name: string): string {
  if (!name) return name;
  return name
    .split(" ")
    .map((word) => maskString(word, 2))
    .join(" ");
}
