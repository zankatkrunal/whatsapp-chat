import https from 'https';

export const sendSmsOtp = async (phone, otp) => {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;

  const messageText = `Your ChatConnect verification code is: ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

  // 1. If Twilio is configured
  if (twilioSid && twilioAuth && twilioPhone) {
    try {
      console.log(`[SMS Gateway: Twilio] Sending OTP to ${phone}...`);
      const authHeader = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const postData = new URLSearchParams({
        To: phone,
        From: twilioPhone,
        Body: messageText,
      }).toString();

      return new Promise((resolve, reject) => {
        const req = https.request(
          {
            hostname: 'api.twilio.com',
            port: 443,
            path: `/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            method: 'POST',
            headers: {
              Authorization: `Basic ${authHeader}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[SMS Gateway: Twilio] SMS sent successfully to ${phone}`);
                resolve({ success: true, provider: 'twilio' });
              } else {
                console.error(`[SMS Gateway: Twilio] Failed to send SMS:`, body);
                resolve({ success: false, error: body, provider: 'twilio' });
              }
            });
          }
        );
        req.on('error', (err) => {
          console.error(`[SMS Gateway: Twilio] Error:`, err.message);
          resolve({ success: false, error: err.message, provider: 'twilio' });
        });
        req.write(postData);
        req.end();
      });
    } catch (err) {
      console.error('[SMS Service] Twilio Error:', err.message);
    }
  }

  // 2. If Fast2SMS (India) is configured
  if (fast2SmsKey) {
    try {
      console.log(`[SMS Gateway: Fast2SMS] Sending OTP to ${phone}...`);
      // Fast2SMS requires 10 digit number without +91
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const postData = JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: cleanPhone,
      });

      return new Promise((resolve) => {
        const req = https.request(
          {
            hostname: 'www.fast2sms.com',
            port: 443,
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
              authorization: fast2SmsKey,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              console.log(`[SMS Gateway: Fast2SMS] Response:`, body);
              resolve({ success: true, provider: 'fast2sms' });
            });
          }
        );
        req.on('error', (err) => {
          console.error(`[SMS Gateway: Fast2SMS] Error:`, err.message);
          resolve({ success: false, error: err.message, provider: 'fast2sms' });
        });
        req.write(postData);
        req.end();
      });
    } catch (err) {
      console.error('[SMS Service] Fast2SMS Error:', err.message);
    }
  }

  // 3. Fallback (Development & Testing without external API keys)
  console.log('======================================================');
  console.log(`[SMS Gateway: DEV MODE] Real SMS Gateways (Twilio/Fast2SMS) not configured in .env`);
  console.log(`>> MOBILE NUMBER: ${phone}`);
  console.log(`>> REAL OTP GENERATED: ${otp}`);
  console.log(`>> VALID FOR: 5 MINUTES`);
  console.log('======================================================');

  return { success: true, provider: 'console_dev', testOtp: otp };
};
