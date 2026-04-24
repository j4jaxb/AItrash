import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { sendVerificationCode, verifyCode, resetPassword, sendVerificationCodeForReset, sendVerificationCodeForRegister } from '../utils/verificationService';
import { validatePassword, getPasswordRequirements, checkPasswordRequirement } from '../utils/passwordValidator';
export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // login, register, verify, forgotPassword, resetPassword
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoadingSendCode, setIsLoadingSendCode] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState(null);
  const [tempEmail, setTempEmail] = useState(''); // เก็บอีเมลชั่วคราวระหว่างการยืนยัน
  const [passwordRequirements] = useState(getPasswordRequirements());

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกทั้งอีเมลและรหัสผ่าน');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .limit(1)
        .single();

      if (error) {
        console.log('Login error', error);
        if (error.message && (error.message.includes('<!DOCTYPE html>') || error.message.includes('521') || error.message.includes('Web server is down'))) {
          Alert.alert('เซิร์ฟเวอร์ไม่พร้อมใช้งาน', 'เซิร์ฟเวอร์กำลังมีปัญหา กรุณาลองใหม่อีกครั้ง');
        } else {
          Alert.alert('ไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
        return;
      }

      onLogin(data);
    } catch (err) {
      console.log('Login network error', err);
      Alert.alert('เซิร์ฟเวอร์ไม่พร้อมใช้งาน', 'เซิร์ฟเวอร์กำลังมีปัญหา กรุณาลองใหม่อีกครั้ง');
    }
  };


  // Debug function - test sending email
  const handleTestEmail = async () => {
    if (!email) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมลก่อน');
      return;
    }
    console.log('📧 Testing email sending...');
    const result = await testSendEmail(email);
    if (result) {
      Alert.alert('สำเร็จ', `ส่งอีเมลทดสอบไปที่ ${email} แล้ว`);
    } else {
      Alert.alert('ล้มเหลว', 'ไม่สามารถส่งอีเมลได้');
    }
  };

  // ยืนยันรหัสสำหรับสมัครสมาชิก
  const handleVerifyCodeForRegistration = async () => {
    if (!verificationCode) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสยืนยัน');
      return;
    }

    const result = await verifyCode(tempEmail, verificationCode);

    if (result.success) {
      // สร้างบัญชีใหม่
      try {
        const { error } = await supabase
          .from('user')
          .insert([{ 
            email: tempEmail, 
            first_name: firstName, 
            last_name: lastName, 
            password 
          }]);

        if (error) {
          Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างบัญชีได้');
          return;
        }

        Alert.alert('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว กรุณาล็อกอิน');
        resetForm();
        setMode('login');
      } catch (err) {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างบัญชีได้');
      }
    } else {
      Alert.alert('เกิดข้อผิดพลาด', result.error);
    }
  };

  // ส่งรหัสยืนยันสำหรับลืมรหัสผ่าน
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมล');
      return;
    }

    setIsLoadingSendCode(true);
    const result = await sendVerificationCodeForReset(email);
    setIsLoadingSendCode(false);

    if (result.success) {
      setTempEmail(email);
      Alert.alert('สำเร็จ', `รหัสยืนยัน 6 หลักถูกส่งไปที่อีเมล ${email}`);
      setMode('resetPassword');
    } else {
      Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถส่งรหัสยืนยันได้');
    }
  };

  // ยืนยันรหัสและรีเซ็ตรหัสผ่าน
  const handleVerifyCodeForReset = async () => {
    if (!verificationCode) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสยืนยัน');
      return;
    }

    const result = await verifyCode(tempEmail, verificationCode);

    if (result.success) {
      setMode('setNewPassword');
      setVerificationCode('');
    } else {
      Alert.alert('เกิดข้อผิดพลาด', result.error);
    }
  };

  // บันทึกรหัสผ่านใหม่
  const handleSetNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสผ่านใหม่ทั้ง 2 ช่อง');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('เกิดข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    // ตรวจสอบรหัสผ่าน
    const { isValid, requirements } = validatePassword(newPassword);
    if (!isValid) {
      const messages = [];
      if (!requirements.hasUpperCase) messages.push('❌ ต้องมีตัวใหญ่ (A-Z)');
      if (!requirements.hasLowerCase) messages.push('❌ ต้องมีตัวเล็ก (a-z)');
      if (!requirements.hasNumber) messages.push('❌ ต้องมีเลข (0-9)');
      if (!requirements.validLength) messages.push('❌ ต้องมี 8-16 ตัวอักษร');
      
      Alert.alert('รหัสผ่านไม่ถูกต้อง', messages.join('\n'));
      return;
    }

    const result = await resetPassword(tempEmail, newPassword);

    if (result.success) {
      Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      resetForm();
      setMode('login');
    } else {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
  };

  // รีเซ็ตฟอร์ม
  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setTempEmail('');
  };

  const handleRegister = async () => {
    if (!email || !firstName || !lastName || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมล, ชื่อ, นามสกุล และรหัสผ่าน');
      return;
    }

    // ตรวจสอบรหัสผ่าน
    const { isValid, requirements } = validatePassword(password);
    if (!isValid) {
      const messages = [];
      if (!requirements.hasUpperCase) messages.push('❌ ต้องมีตัวใหญ่ (A-Z)');
      if (!requirements.hasLowerCase) messages.push('❌ ต้องมีตัวเล็ก (a-z)');
      if (!requirements.hasNumber) messages.push('❌ ต้องมีเลข (0-9)');
      if (!requirements.validLength) messages.push('❌ ต้องมี 8-16 ตัวอักษร');
      
      Alert.alert('รหัสผ่านไม่ถูกต้อง', messages.join('\n'));
      return;
    }

    // ส่งรหัสยืนยันไปที่อีเมล (เชค email ว่าไม่มีในระบบก่อน)
    setIsLoadingSendCode(true);
    const result = await sendVerificationCodeForRegister(email);
    setIsLoadingSendCode(false);

    if (result.success) {
      setTempEmail(email);
      Alert.alert('สำเร็จ', `รหัสยืนยัน 6 หลักถูกส่งไปที่อีเมล ${email} (หมดอายุใน 10 นาที)`);
      setMode('verify');
    } else {
      Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถส่งรหัสยืนยันได้ กรุณาลองใหม่');
    }
  };

  const onSubmit = mode === 'login' ? handleLogin : 
                  mode === 'register' ? handleRegister :
                  mode === 'verify' ? handleVerifyCodeForRegistration :
                  mode === 'forgotPassword' ? handleForgotPassword :
                  mode === 'resetPassword' ? handleVerifyCodeForReset :
                  mode === 'setNewPassword' ? handleSetNewPassword :
                  handleLogin;

  return (
    <View style={styles.container}>
      {/* Show title only for non-scrollable modes */}
      {(mode === 'login' || mode === 'verify' || mode === 'forgotPassword' || mode === 'resetPassword') && (
        <Text style={styles.title}>
          {mode === 'login' ? 'เข้าสู่ระบบ' : 
           mode === 'verify' ? 'ยืนยันรหัส' :
           mode === 'forgotPassword' ? 'ลืมรหัสผ่าน' :
           'ยืนยันเพื่อเปลี่ยนรหัสผ่าน'}
        </Text>
      )}

      {/* Login Mode */}
      {mode === 'login' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.button}>
            <Button title="Login" onPress={onSubmit} color="#1f78b4" />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.hint}>ยังไม่มีบัญชี?</Text>
            <TouchableOpacity onPress={() => { resetForm(); setMode('register'); }}>
              <Text style={styles.switch}> ลงทะเบียน</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => { setEmail(''); setMode('forgotPassword'); }}>
            <Text style={[styles.switch, { marginTop: 12 }]}>ลืมรหัสผ่าน?</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Register Mode */}
      {mode === 'register' && (
        <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.title}>ลงทะเบียน</Text>
          <Text>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <Text>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <Text>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          
          {/* Password Requirements */}

            {passwordRequirements.map((req) => {
              const isMet = checkPasswordRequirement(password, req.key);
              return (
                <View key={req.key} style={styles.requirementRow}>
                  <MaterialCommunityIcons 
                    name={isMet ? "check-circle" : "circle-outline"} 
                    size={20} 
                    color={isMet ? "#10b981" : "#d1d5db"}
                    style={{marginRight: 8}}
                  />
                  <Text style={[styles.requirementText, isMet && styles.requirementMet]}>
                    {req.label}
                  </Text>
                </View>
              );
            })}
          

          <View style={styles.button}>
            <Button 
              title={isLoadingSendCode ? "กำลังส่ง..." : "ส่งรหัสยืนยัน"} 
              onPress={onSubmit} 
              color="#1f78b4"
              disabled={isLoadingSendCode}
            />
          </View>

          {/* Link to Login - ย้ายไปล่าง ตรงกลาง */}
          <View style={styles.bottomLink}>
            <Text style={styles.hint}>มีบัญชีแล้ว?</Text>
            <TouchableOpacity onPress={() => { resetForm(); setMode('login'); }}>
              <Text style={styles.switch}> เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Verify Code for Registration */}
      {mode === 'verify' && (
        <>
          <Text style={styles.info}>รหัสยืนยันถูกส่งไปที่ {tempEmail}</Text>
          <TextInput
            style={styles.input}
            placeholder="กรอกรหัสยืนยัน 6 หลัก"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
            maxLength={6}
          />
          <View style={styles.button}>
            <Button title="ยืนยัน" onPress={onSubmit} color="#1f78b4" />
          </View>
          <TouchableOpacity onPress={() => { resetForm(); setMode('login'); }}>
            <Text style={[styles.switch, { marginTop: 12, textAlign: 'center' }]}>กลับไปเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Forgot Password */}
      {mode === 'forgotPassword' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.button}>
            <Button 
              title={isLoadingSendCode ? "กำลังส่ง..." : "ส่งรหัสยืนยัน"} 
              onPress={onSubmit} 
              color="#1f78b4"
              disabled={isLoadingSendCode}
            />
          </View>
          <View style={styles.switchRow}>
            <TouchableOpacity onPress={() => { resetForm(); setMode('login'); }}>
              <Text style={styles.switch}>กลับไปเข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Verify Code for Reset Password */}
      {mode === 'resetPassword' && (
        <>
          <Text style={styles.info}>รหัสยืนยันถูกส่งไปที่ {tempEmail}</Text>
          <TextInput
            style={styles.input}
            placeholder="กรอกรหัสยืนยัน 6 หลัก"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
            maxLength={6}
          />
          <View style={styles.button}>
            <Button title="ยืนยัน" onPress={onSubmit} color="#1f78b4" />
          </View>
          <TouchableOpacity onPress={() => { resetForm(); setMode('login'); }}>
            <Text style={[styles.switch, { marginTop: 12, textAlign: 'center' }]}>กลับไปเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Set New Password */}
      {mode === 'setNewPassword' && (
        <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.title}>ตั้งรหัสผ่านใหม่</Text>
          <TextInput
            style={styles.input}
            placeholder="รหัสผ่านใหม่"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="ยืนยันรหัสผ่านใหม่"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          
          {/* Password Requirements */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>📋 ความต้องการของรหัสผ่าน:</Text>
            {passwordRequirements.map((req) => {
              const isMet = checkPasswordRequirement(newPassword, req.key);
              return (
                <View key={req.key} style={styles.requirementRow}>
                  <MaterialCommunityIcons 
                    name={isMet ? "check-circle" : "circle-outline"} 
                    size={20} 
                    color={isMet ? "#10b981" : "#d1d5db"}
                    style={{marginRight: 8}}
                  />
                  <Text style={[styles.requirementText, isMet && styles.requirementMet]}>
                    {req.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.button}>
            <Button title="เปลี่ยนรหัสผ่าน" onPress={onSubmit} color="#1f78b4" />
          </View>
          <TouchableOpacity onPress={() => { resetForm(); setMode('login'); }}>
            <Text style={[styles.switch, { marginTop: 12, textAlign: 'center' }]}>กลับไปเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    padding: 24,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333'
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 12
  },
  button: {
    width: '100%',
    marginTop: 6,
    borderRadius: 8,
    overflow: 'hidden'
  },
  hint: {
    marginTop: 14,
    color: '#666',
    textAlign: 'center'
  },
  info: {
    marginBottom: 16,
    color: '#555',
    textAlign: 'center',
    fontSize: 14
  },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  switch: {
    color: '#1f78b4',
    fontWeight: '600'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  // Password Requirements Styles
  requirementsBox: {
    backgroundColor: '#f0f8f4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669'
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#999',
    flex: 1
  },
  requirementMet: {
    color: '#059669',
    fontWeight: '500'
  },
  // ScrollView Styles
  scrollViewContainer: {
    width: '100%',
    flex: 1
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40
  },
  // Bottom Link for Register Mode
  bottomLink: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});