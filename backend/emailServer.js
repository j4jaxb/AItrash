import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // เปลี่ยนจาก 5000 เป็น 5001

// Middleware
app.use(express.json());
app.use(cors());

// ตั้งค่า Email Configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'jnp.trash@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'sqzy gdkg nzah zftz' // App Password
  }
};

// สร้าง Transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * ส่งรหัสยืนยัน
 * POST /api/email/send-verification
 */
app.post('/api/email/send-verification', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const mailOptions = {
      from: `"recyte" <${emailConfig.auth.user}>`,
      to: email,
      subject: '📧 รหัสยืนยันของคุณ - recyte',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #e8f5e9; }
              .container { max-width: 500px; margin: 20px auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 12px rgba(46, 125, 50, 0.15); }
              .header { text-align: center; margin-bottom: 30px; }
              .code-box { background-color: #2e7d32; color: white; padding: 22px; border-radius: 12px; text-align: center; margin: 20px 0; font-size: 34px; font-weight: 700; letter-spacing: 4px; font-family: monospace; }
              .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
              .warning { background-color: #f1f8e9; padding: 12px; border-radius: 6px; margin-top: 20px; color: #33691e; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #2e7d32; margin: 0;">♻️ recyte</h1>
                <p style="color: #4f5d33; margin: 5px 0;">แอปจัดการขยะและรีไซเคิลอย่างชาญฉลาด</p>
              </div>
              
              <p>สวัสดี!</p>
              <p>เราได้รับคำขอเพื่อยืนยันบัญชีหรือเปลี่ยนรหัสผ่านของคุณ</p>
              
              <p style="text-align: center; color: #264d26;">รหัสยืนยันของคุณคือ:</p>
              <div class="code-box">${code}</div>
              
              <p style="color: #4f5d33; font-size: 14px;">
                โปรดใช้รหัสนี้ในแอป recyte<br>
                <strong>⏰ รหัสนี้จะหมดอายุใน 10 นาที</strong>
              </p>
              
              <div class="warning">
                ⚠️ หากคุณไม่ได้ขอรหัสยืนยันนี้ กรุณาละเว้นอีเมลนี้
              </div>
              
              <div class="footer">
                <p>© 2026 recyte. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `รหัสยืนยันของคุณ: ${code}\nรหัสนี้จะหมดอายุใน 10 นาที`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);

    res.json({ 
      success: true, 
      message: 'Verification email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

/**
 * ส่งอีเมลยืนยันการสร้างบัญชี
 * POST /api/email/send-welcome
 */
app.post('/api/email/send-welcome', async (req, res) => {
  try {
    const { email, firstName } = req.body;

    if (!email || !firstName) {
      return res.status(400).json({ error: 'Email and firstName are required' });
    }

    const mailOptions = {
      from: `"recyte" <${emailConfig.auth.user}>`,
      to: email,
      subject: '🎉 ยินดีต้อนรับสู่ recyte',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #e8f5e9;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 12px rgba(46, 125, 50, 0.15);">
            <h1 style="color: #2e7d32;">🎉 ยินดีต้อนรับ ${firstName}!</h1>
            <p>บัญชีของคุณถูกสร้างเรียบร้อยแล้ว</p>
            <p>คุณพร้อมที่จะเริ่มใช้ recyte เพื่อจัดการขยะและรีไซเคิลได้อย่างสะดวก</p>
            <p style="margin-top: 30px; color: #4f5d33;">
              หากมีคำถามใด ติดต่อเราได้ที่ support@recyte.com
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);

    res.json({ 
      success: true, 
      message: 'Welcome email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

/**
 * ส่งอีเมลแจ้งปัญหาไปยังทีม Support
 * POST /api/email/send-support
 */
app.post('/api/email/send-support', async (req, res) => {
  try {
    const { userEmail, userName, message } = req.body;

    if (!userEmail || !message) {
      return res.status(400).json({ error: 'userEmail and message are required' });
    }

    // 1. ส่งอีเมลเข้ากล่องขาเข้าของ Support (เพื่อรับเรื่อง)
    const supportMailOptions = {
      from: `"recyte" <${emailConfig.auth.user}>`,
      to: emailConfig.auth.user, // ส่งหาตัวเอง (ทีมซัพพอร์ต)
      replyTo: userEmail, // ตั้งค่าให้กด Reply แล้วตอบกลับไปยังผู้ใช้
      subject: `🛑 [Support Ticket] จาก ${userName || userEmail}`,
      text: `มีผู้ใช้ส่งข้อความขอความช่วยเหลือ:\n\nชื่อผู้ใช้: ${userName || 'ไม่ระบุ'}\nอีเมล: ${userEmail}\n\nข้อความ:\n${message}`
    };

    // 2. ส่งอีเมลยืนยันกลับไปยังผู้ใช้ (ว่าได้รับเรื่องแล้ว)
    const userMailOptions = {
      from: `"recyte Support" <${emailConfig.auth.user}>`,
      to: userEmail,
      subject: '✅ เราได้รับข้อความของคุณแล้ว (recyte Support)',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #e8f5e9;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 12px rgba(46, 125, 50, 0.15);">
            <h2 style="color: #2e7d32;">สวัสดี ${userName || ''}!</h2>
            <p>เราได้รับข้อความของคุณเรียบร้อยแล้ว ทีมงาน recyte จะรีบตรวจสอบและตอบกลับภายในเร็วที่สุด</p>
            <hr style="border: 0; border-top: 1px solid #c8e6c9; margin: 20px 0;">
            <p style="color: #4f5d33; font-size: 14px;">ข้อความของคุณ:</p>
            <blockquote style="border-left: 3px solid #2e7d32; padding-left: 10px; color: #555;">
              ${message}
            </blockquote>
          </div>
        </div>
      `
    };

    await transporter.sendMail(supportMailOptions);
    await transporter.sendMail(userMailOptions);
    
    console.log('✅ Support email sent from:', userEmail);

    res.json({ 
      success: true, 
      message: 'Support email sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending support email:', error);
    res.status(500).json({ error: 'Failed to send support email' });
  }
});

/**
 * ทดสอบการเชื่อมต่อ
 * GET /api/email/health
 */
app.get('/api/email/health', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ 
      status: 'healthy',
      message: 'Email service is working correctly'
    });
  } catch (error) {
    console.error('❌ Email service health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Email service is not working'
    });
  }
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'recyte Email Service',
    endpoints: {
      'POST /api/email/send-verification': 'Send verification code',
      'POST /api/email/send-welcome': 'Send welcome email',
      'POST /api/email/send-support': 'Send support request',
      'GET /api/email/health': 'Health check'
    }
  });
});

// เริ่มต้น Server
app.listen(PORT, () => {
  console.log(`\n🚀 recyte Email Server running on port ${PORT}`);
  console.log(`📧 Email: ${emailConfig.auth.user}`);
  console.log(`\n📌 API URL: http://localhost:${PORT}\n`);
});
