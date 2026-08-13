import { getAccessToken } from './firebase';

export async function sendEmailViaGmail(to: string, subject: string, bodyText: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in to send emails.');
  }

  // Create a raw email
  // Format:
  // To: {to}
  // Subject: {subject}
  // Content-Type: text/plain; charset="UTF-8"
  //
  // {bodyText}
  const emailContent = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${bodyText}`;
  
  // Base64url encode the email
  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('Failed to send email via Gmail:', errData);
    throw new Error(errData?.error?.message || 'Failed to send email');
  }

  return true;
}
