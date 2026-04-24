import { supabase } from '../supabase';
import { sendVerificationEmailWithNodemailer } from './emailService';

// สร้างรหัสยืนยัน 6 หลัก
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// เชคว่าอีเมลมีในระบบหรือไม่
export const checkEmailExists = async (email) => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('email')
      .eq('email', email)
      .limit(1)
      .single();

    if (error) {
      // ถ้า error เพราะไม่มีข้อมูล (PGRST116) แสดงว่าไม่มีอีเมลนี้ในระบบ
      if (error.code === 'PGRST116') {
        return { exists: false };
      }
      return { exists: false, error };
    }

    return { exists: true, email: data?.email };
  } catch (error) {
    console.log('Error checking email:', error);
    return { exists: false, error };
  }
};

// ส่งรหัสยืนยันไปที่อีเมล
export const sendVerificationCode = async (email) => {
  try {
    const code = generateVerificationCode();
    
    // บันทึกรหัสยืนยันลงฐานข้อมูล (เก็บพร้อมเวลาหมดอายุ)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10); // หมดอายุใน 10 นาที
    
    const { error } = await supabase
      .from('verification_codes')
      .insert([
        {
          email,
          code,
          expires_at: expiryTime.toISOString(),
          is_used: false
        }
      ]);

    if (error) {
      console.log('Error saving verification code:', error);
      return { success: false, error };
    }

    // ส่งอีเมลผ่าน Nodemailer (แนะนำ)
    const emailResult = await sendVerificationEmailWithNodemailer(email, code);
    
    if (!emailResult) {
      console.warn('Email sending failed, but code was saved');
      // ยังคงส่งกลับ success เพราะรหัสถูกบันทึกแล้ว
    }

    return { success: true, code };
  } catch (error) {
    console.log('Error sending verification code:', error);
    return { success: false, error };
  }
};

// ส่งรหัสยืนยันสำหรับลืมรหัสผ่าน (เชค email ว่ามีในระบบก่อน)
export const sendVerificationCodeForReset = async (email) => {
  try {
    // เชคว่า email มีในระบบหรือไม่
    const { exists } = await checkEmailExists(email);
    
    if (!exists) {
      return { success: false, error: 'ไม่พบอีเมลนี้ในระบบ' };
    }

    // ส่งรหัสยืนยันปกติ
    return await sendVerificationCode(email);
  } catch (error) {
    console.log('Error in sendVerificationCodeForReset:', error);
    return { success: false, error };
  }
};

// ส่งรหัสยืนยันสำหรับลงทะเบียน (เชค email ว่าไม่มีในระบบก่อน)
export const sendVerificationCodeForRegister = async (email) => {
  try {
    // เชคว่า email มีในระบบหรือไม่
    const { exists } = await checkEmailExists(email);
    
    if (exists) {
      return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }

    // ส่งรหัสยืนยันปกติ
    return await sendVerificationCode(email);
  } catch (error) {
    console.log('Error in sendVerificationCodeForRegister:', error);
    return { success: false, error };
  }
};

// ยืนยันรหัส
export const verifyCode = async (email, code) => {
  try {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (error || !data) {
      return { success: false, error: 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว' };
    }

    // ทำเครื่องหมายว่าใช้แล้ว
    await supabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', data.id);

    return { success: true };
  } catch (error) {
    console.log('Error verifying code:', error);
    return { success: false, error: 'เกิดข้อผิดพลาด' };
  }
};

// รีเซ็ตรหัสผ่าน
export const resetPassword = async (email, newPassword) => {
  try {
    const { error } = await supabase
      .from('user')
      .update({ password: newPassword })
      .eq('email', email);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.log('Error resetting password:', error);
    return { success: false, error };
  }
};
