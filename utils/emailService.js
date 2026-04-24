/**
 * Email Service - เรียก Backend API เพื่อส่งอีเมล
 * 
 * ⚠️ Nodemailer ไม่สามารถใช้ใน React Native ได้
 * เราใช้ Backend API แทน
 * 
 * Backend API ดูที่ไฟล์: ../backend/emailServer.js
 */

// Backend API URL (แก้ไขให้ตรงกับ server จริง)
// สำหรับ development: ใช้ IP address แทน localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://172.20.10.2:5001';

/**
 * ส่งรหัสยืนยันไปที่อีเมล (เรียก Backend API)
 * @param {string} email - อีเมลปลายทาง
 * @param {string} code - รหัสยืนยัน 6 หลัก
 * @returns {Promise<boolean>}
 */
export const sendVerificationEmailWithNodemailer = async (email, code) => {
  try {
    console.log('📧 Sending verification email to:', email);
    console.log('🔗 API URL:', `${API_BASE_URL}/api/email/send-verification`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, code }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Email API error:', data.error);
      return false;
    }

    console.log('✅ Email sent successfully via backend API');
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Email API timeout after 10 seconds');
    } else {
      console.error('❌ Error calling email API:', error.message);
    }
    return false;
  }
};

/**
 * ส่งอีเมลยืนยันการสร้างบัญชี (เรียก Backend API)
 */
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email/send-welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, firstName })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error sending welcome email:', data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error calling welcome email API:', error);
    return false;
  }
};

/**
 * ทดสอบการเชื่อมต่อ Backend API
 */
export const testEmailConnection = async () => {
  try {
    console.log('🔍 Testing email API connection...');
    console.log('🔗 Testing URL:', `${API_BASE_URL}/api/email/health`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/api/email/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Email service is healthy:', data);
      return true;
    } else {
      console.error('❌ Email service returned status:', response.status);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Email API timeout after 5 seconds');
    } else {
      console.error('❌ Cannot connect to email service:', error.message);
    }
    return false;
  }
};

/**
 * ทดสอบส่งอีเมล (สำหรับ debug)
 */
export const testSendEmail = async (testEmail = 'test@example.com') => {
  try {
    console.log('📧 Testing email sending to:', testEmail);
    
    const testCode = '123456';
    const result = await sendVerificationEmailWithNodemailer(testEmail, testCode);
    
    if (result) {
      console.log('✅ Test email sent successfully!');
      return true;
    } else {
      console.log('❌ Test email failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error in test email:', error);
    return false;
  }
};
