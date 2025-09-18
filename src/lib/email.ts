import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,       // your Gmail address
    pass: process.env.EMAIL_PASSWORD,   // your Gmail app password
  },
});

export async function sendOTPEmail(to: string, otp: string) {
  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Secure Login Verification - FRUGO Dashboard',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px 20px;">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 60px;">
          <img src="https://res.cloudinary.com/drz4r2wgj/image/upload/v1756806650/ChatGPT_Image_Sep_2_2025_03_20_09_PM_1_zvihry.jpg" 
     alt="FRUGO" 
     style="max-width: 100px; height: auto; "
     width="100">
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 60px 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <h2 style="font-size: 28px; color: #333; margin: 0 0 40px 0; font-weight: 600;">
            Secure Login Verification
          </h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 50px 0;">
            To complete your login to FRUGO, please enter the following<br>
            One-Time Password
          </p>
          
          <!-- OTP Display -->
          <div style="margin: 50px 0; padding: 30px; background-color: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 48px; font-weight: bold; color: #333; letter-spacing: 8px; margin-bottom: 20px;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.4;">
              This OTP is valid for 5 minutes and can only be used once.<br>
              Please do not share this code with anyone.
            </p>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #999; font-size: 14px;">
          <p style="margin: 0;">If you didn't request this login, please contact your administrator.</p>
        </div>
        
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}


export async function sendWelcomeEmail(to: string, userName: string) {
  const siteUrl = process.env.SITE_URL ;
  const dashboardLink = `${siteUrl}/`;

  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to FRUGO - You're all set!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px 20px;">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 60px;">
          <img src="https://res.cloudinary.com/drz4r2wgj/image/upload/v1756806650/ChatGPT_Image_Sep_2_2025_03_20_09_PM_1_zvihry.jpg" 
               alt="FRUGO" 
               style="max-width: 100px; height: auto;"
               width="100">
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 60px 40px; border-radius: 12px; text-align: left; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <h1 style="font-size: 32px; color: #333; margin: 0 0 60px 0; font-weight: 700; text-align: center; line-height: 1.2;">
            Welcome to FRUGO –<br>You're all set!
          </h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hi ,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Your FRUGO account has been successfully activated.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            You now have access to your assigned modules and can begin managing orders, picklists, and labels.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 50px 0;">
            We're excited to have you onboard!
          </p>
          
          <!-- Dashboard Button -->
          <div style="margin: 50px 0 0 0;">
            <a href="${dashboardLink}" 
               style="background-color: #333; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #999; font-size: 14px; line-height: 1.5;">
          <p style="margin: 0;">If you have any questions or need assistance, please contact your administrator.</p>
        </div>
        
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}



export async function sendSetPasswordEmail(to: string, token: string) {
  const siteUrl = process.env.SITE_URL;
  const link = `${siteUrl}/set-password?token=${token}`;

  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: "You're Invited to FRUGO Dashboard",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px 20px;">
        
        <!-- Logo Section -->
       <div style="text-align: center; margin-bottom: 60px;">
          <img src="https://res.cloudinary.com/drz4r2wgj/image/upload/v1756806650/ChatGPT_Image_Sep_2_2025_03_20_09_PM_1_zvihry.jpg" 
               alt="FRUGO" 
               style="max-width: 100px; height: auto;"
               width="100">
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 60px 40px; border-radius: 12px; text-align: left; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <h1 style="font-size: 32px; color: #333; margin: 0 0 40px 0; font-weight: 700; text-align: center;">
            You're Invited to FRUGO<br>Dashboard
          </h1>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi,
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            You've been invited to create a staff account on the FRUGO Order Automation System.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Once you accept the invite, you'll be able to access the dashboard and begin collaborating with your team.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            If you weren't expecting this invitation, feel free to ignore it.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0;">
            This link will expire in 7 days.
          </p>
          
          <!-- Accept Button -->
          <div style="margin: 40px 0;">
            <a href="${link}" 
               style="background-color: #333; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
              Accept Invite
            </a>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #999; font-size: 14px; line-height: 1.5;">
          <p style="margin: 0;">If you have any questions or need assistance, please contact your administrator.</p>
        </div>
        
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}


// ✅ New function for security alert
export async function sendSecurityAlertEmail(to: string, ipAddress?: string, userAgent?: string) {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const siteUrl = process.env.SITE_URL;
  
  const mailOptions = {
    from: `"Security Alert" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🚨 Security Alert - Login Attempt Detected - FRUGO Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #d32f2f; margin-bottom: 10px;">🚨 Security Alert</h2>
          <p style="color: #666; font-size: 16px;">Suspicious login activity detected</p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #856404; margin-top: 0;">Login Attempt Details</h3>
          <ul style="color: #856404; margin: 10px 0;">
            <li><strong>Time:</strong> ${timestamp}</li>
            ${ipAddress ? `<li><strong>IP Address:</strong> ${ipAddress}</li>` : ''}
            ${userAgent ? `<li><strong>Device/Browser:</strong> ${userAgent}</li>` : ''}
            <li><strong>Status:</strong> Login initiated but OTP not completed</li>
          </ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #333;">What happened?</h3>
          <p style="color: #666;">
            Someone entered the correct password for your account and reached the OTP verification step, 
            but did not complete the login process. This could indicate:
          </p>
          <ul style="color: #666;">
            <li>You started logging in but didn't complete it</li>
            <li>Someone may have gained access to your password</li>
            <li>An automated attack attempt</li>
          </ul>
        </div>

        <div style="background-color: #ffebee; border: 1px solid #ffcdd2; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #c62828; margin-top: 0;">Recommended Actions</h3>
          <ol style="color: #c62828; margin: 10px 0;">
            <li><strong>Change your password immediately</strong> if this wasn't you</li>
            <li>Review recent account activity</li>
            <li>Enable additional security measures if available</li>
            <li>Contact support if you notice any unauthorized access</li>
          </ol>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${siteUrl}/" 
             style="display: inline-block; background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
            Change Password
          </a>
        </div>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 5px 0;">
            This is an automated security alert. If this was you, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0;">
            If you need help, contact our support team
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ✅ Alternative: Simpler security alert version
export async function sendSimpleSecurityAlert(to: string) {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  const mailOptions = {
    from: `"Security Alert" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🚨 Security Alert - Incomplete Login Attempt - FRUGO Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5">
        <h2 style="color: #d32f2f;">🚨 Security Alert</h2>
        <p>Someone attempted to log into your account at <strong>${timestamp}</strong> but did not complete the OTP verification.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>⚠️ If this wasn't you:</strong>
          <ol>
            <li>Change your password immediately</li>
            <li>Check for any unauthorized account activity</li>
            <li>Contact support if needed</li>
          </ol>
        </div>
        
        <p>If this was you, you can safely ignore this email.</p>
        <p><em>This is an automated security notification.</em></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ✅ New function for successful login notification
export async function sendLoginNotificationEmail(
  to: string, 
  ipAddress?: string, 
  userAgent?: string, 
  location?: string
) {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  // Parse user agent for better display
  const deviceInfo = parseUserAgent(userAgent);
  
  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'A new device has logged into your account - FRUGO Dashboard',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px 20px;">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 60px;">
          <img src="https://res.cloudinary.com/drz4r2wgj/image/upload/v1756806650/ChatGPT_Image_Sep_2_2025_03_20_09_PM_1_zvihry.jpg" 
               alt="FRUGO" 
               style="max-width: 100px; height: auto; "
               width="100">
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 60px 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <h2 style="font-size: 28px; color: #333; margin: 0 0 40px 0; font-weight: 600;">
            New Device Login Detected
          </h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 50px 0; text-align: left;">
            Hi there,<br><br>
            It looks like you signed into your <strong>FRUGO account</strong> from a new device.
          </p>
          
          <!-- Login Details -->
          <div style="margin: 50px 0; padding: 30px; background-color: #f8f9fa; border-radius: 8px; text-align: left;">
            <h3 style="font-size: 18px; color: #333; margin: 0 0 20px 0; font-weight: 600;">Login Details</h3>
            <div style="color: #666; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${timestamp}</p>
              <p style="margin: 0 0 8px 0;"><strong>Device:</strong> ${deviceInfo.browser} on ${deviceInfo.os}</p>
              <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${location || 'Unknown'}</p>
              <p style="margin: 0 0 0 0;"><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
            </div>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0; text-align: left;">
            If this wasn't you, please contact your administrator immediately to secure your account.
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #999; font-size: 14px;">
          <p style="margin: 0;">If you have any questions or need assistance, please contact your administrator.</p>
        </div>
        
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const siteUrl = process.env.SITE_URL ;
  const link = `${siteUrl}/forgot-password?token=${token}`;

  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - FRUGO Dashboard',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px 20px;">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 50px;">
          <img src="https://res.cloudinary.com/drz4r2wgj/image/upload/v1756806650/ChatGPT_Image_Sep_2_2025_03_20_09_PM_1_zvihry.jpg" 
               alt="FRUGO" 
               style="max-width: 100px; height: auto;">
        </div>

        <!-- Main Card -->
        <div style="background-color: white; padding: 50px 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="font-size: 26px; color: #333; font-weight: 600; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 40px;">
            We received a request to reset the password for your account.<br>
            If you made this request, click the button below to set a new password.
          </p>

          <!-- Reset Button -->
          <a href="${link}" 
             style="display: inline-block; background-color: #30368D; color: white; padding: 14px 28px; text-decoration: none; font-weight: 600; border-radius: 6px;">
            Reset Password
          </a>

          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #999; font-size: 12px;">
          <p style="margin: 0;">If you need assistance, please contact our support team.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}



// ✅ Helper function to parse user agent
function parseUserAgent(userAgent?: string) {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
  
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  
  // Simple browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';
  
  // Simple OS detection
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  return { browser, os };
}

// ✅ Simple version for basic notification
export async function sendSimpleLoginNotification(to: string, timestamp?: string) {
  const loginTime = timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  const mailOptions = {
    from: `"Account Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: '✅ New Login to Your Account - FRUGO Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5">
        <h2 style="color: #2e7d32;">✅ Login Successful</h2>
        <p>A new login to your account was detected at <strong>${loginTime}</strong>.</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>✅ If this was you:</strong> No action needed. Your account is secure.</p>
          <p><strong>⚠️ If this wasn't you:</strong> Please change your password immediately and contact support.</p>
        </div>
        
        <p>Thank you for keeping your account secure!</p>
        <p><em>This is an automated security notification.</em></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordChangedEmail(to: string, userName: string) {
  const siteUrl = process.env.SITE_URL;
  const updatePasswordLink = `${siteUrl}/update-password`;

  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your password has been changed - FRUGO Dashboard",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px 20px;">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 60px;">
          <img src="https://res.cloudinary.com/drz4r2wgj/image/upload/v1756806650/ChatGPT_Image_Sep_2_2025_03_20_09_PM_1_zvihry.jpg" 
               alt="FRUGO" 
               style="max-width: 100px; height: auto;"
               width="100">
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 60px 40px; border-radius: 12px; text-align: left; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <h1 style="font-size: 32px; color: #333; margin: 0 0 60px 0; font-weight: 700; text-align: center; line-height: 1.2;">
            Your password has been changed
          </h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hi ,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Your password was successfully updated on your FRUGO account.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            If you made this change, no further action is needed.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 50px 0;">
            If you did not request this change, please reset your password immediately to secure your account.
          </p>
          
          <!-- Update Password Button -->
          <div style="margin: 50px 0 0 0;">
            <a href="${updatePasswordLink}" 
               style="background-color: #333; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #999; font-size: 14px; line-height: 1.5;">
          <p style="margin: 0;">If you have any questions or need assistance, please contact your administrator.</p>
        </div>
        
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendEmailUpdatedNotification(
  to: string, 
  userName: string, 
  oldEmail: string,
  newEmail: string, 
  updateDateTime: string
) {
  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Email Address Was Updated - FRUGO Dashboard",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 40px 20px;">
        
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 60px;">
          <img src="https://res.cloudinary.com/drz4r2wgj/image/upload/v1756806650/ChatGPT_Image_Sep_2_2025_03_20_09_PM_1_zvihry.jpg" 
               alt="FRUGO" 
               style="max-width: 100px; height: auto;"
               width="100">
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 60px 40px; border-radius: 12px; text-align: left; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <h1 style="font-size: 32px; color: #333; margin: 0 0 60px 0; font-weight: 700; text-align: center; line-height: 1.2;">
            Your Email Address Was Updated
          </h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hi [${userName}],
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Your email address has been successfully updated in your FRUGO account.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 50px 0;">
            If you didn't request this change, please contact support immediately.
          </p>
          
          <!-- Update Details Section -->
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin: 50px 0;">
            <h3 style="color: #333; font-size: 18px; font-weight: 600; margin: 0 0 25px 0;">
              Update Details
            </h3>
            
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #666; font-size: 16px; font-weight: 500; min-width: 120px;">Old Email:</span>
                <span style="color: #666; font-size: 16px;">${oldEmail}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #666; font-size: 16px; font-weight: 500; min-width: 120px;">New Email:</span>
                <span style="color: #666; font-size: 16px;">${newEmail}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #666; font-size: 16px; font-weight: 500; min-width: 120px;">Updated On:</span>
                <span style="color: #666; font-size: 16px;">${updateDateTime}</span>
              </div>
            </div>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #999; font-size: 14px; line-height: 1.5;">
          <p style="margin: 0;">If you have any questions or need assistance, please contact your administrator.</p>
        </div>
        
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}