
/**
 * Email utilities for sending OTPs and verification emails
 * This is a mock implementation - replace with actual email service
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export async function sendOtpEmail(email: string, otpCode: string, type: 'LOGIN' | 'VERIFICATION' | 'PASSWORD_RESET'): Promise<boolean> {
  // In production, replace this with your email service (SendGrid, AWS SES, etc.)
  console.log(`\n=== EMAIL SENT ===`);
  console.log(`To: ${email}`);
  console.log(`Type: ${type}`);
  console.log(`OTP Code: ${otpCode}`);
  
  const templates = {
    LOGIN: {
      subject: 'Your Shellff Login Code',
      text: `Your login code is: ${otpCode}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9B5DE5;">Your Shellff Login Code</h2>
          <p>Your login code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #00F5D4; text-align: center; 
                      background: #121212; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    },
    VERIFICATION: {
      subject: 'Verify Your Shellff Account',
      text: `Welcome to Shellff! Your verification code is: ${otpCode}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9B5DE5;">Welcome to Shellff!</h2>
          <p>Thank you for joining our music platform. To complete your registration, please use this verification code:</p>
          <div style="font-size: 32px; font-weight: bold; color: #00F5D4; text-align: center; 
                      background: #121212; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `
    },
    PASSWORD_RESET: {
      subject: 'Reset Your Shellff Password',
      text: `Your password reset code is: ${otpCode}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9B5DE5;">Reset Your Password</h2>
          <p>You requested to reset your Shellff password. Use this code to continue:</p>
          <div style="font-size: 32px; font-weight: bold; color: #00F5D4; text-align: center; 
                      background: #121212; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    }
  };
  
  const template = templates[type];
  console.log(`Subject: ${template.subject}`);
  console.log(`Content: ${template.text}`);
  console.log(`==================\n`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return true;
}

export async function sendWelcomeEmail(email: string, firstName: string, userId: string, sciId?: string): Promise<boolean> {
  console.log(`\n=== WELCOME EMAIL SENT ===`);
  console.log(`To: ${email}`);
  console.log(`Name: ${firstName}`);
  console.log(`User ID: ${userId}`);
  if (sciId) {
    console.log(`Creator ID (SCI): ${sciId}`);
  }
  console.log(`Subject: Welcome to Shellff!`);
  
  const template = {
    subject: 'Welcome to Shellff!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9B5DE5;">Welcome to Shellff, ${firstName}!</h2>
        <p>Thank you for joining our decentralized music streaming platform!</p>
        
        <div style="background: #121212; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #00F5D4; margin: 0;"><strong>Your User ID:</strong> ${userId}</p>
          ${sciId ? `<p style="color: #FFC107; margin: 5px 0 0 0;"><strong>Your Creator ID:</strong> ${sciId}</p>` : ''}
        </div>
        
        ${sciId 
          ? '<p>As a Creator, you can now upload music, build your fanbase, and earn from your streams!</p>' 
          : '<p>As a Listener, you can discover amazing music and support your favorite artists. You can upgrade to a Creator account anytime!</p>'
        }
        
        <p>Get started by exploring the platform and discovering new music.</p>
        <p>Welcome to the future of music!</p>
      </div>
    `,
    text: `Welcome to Shellff, ${firstName}! Your User ID: ${userId}${sciId ? `. Your Creator ID: ${sciId}` : ''}. Welcome to the future of music!`
  };
  
  console.log(`Content Preview: ${template.text}`);
  console.log(`========================\n`);
  
  return true;
}
