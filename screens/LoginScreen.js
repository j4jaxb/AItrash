import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../supabase';

import {
  verifyCode,
  resetPassword,
  sendVerificationCodeForReset,
  sendVerificationCodeForRegister
} from '../utils/verificationService';

import {
  validatePassword,
  getPasswordRequirements,
  checkPasswordRequirement
} from '../utils/passwordValidator';

export default function LoginScreen({ onLogin }) {

  const [mode, setMode] = useState('login');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [verificationCode, setVerificationCode] = useState('');
  const [isLoadingSendCode, setIsLoadingSendCode] = useState(false);

  const [tempEmail, setTempEmail] = useState('');

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
        Alert.alert('ไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        return;
      }

      onLogin(data);

    } catch (err) {
      Alert.alert('เซิร์ฟเวอร์ไม่พร้อมใช้งาน', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleRegister = async () => {

    if (!email || !firstName || !lastName || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const { isValid, requirements } = validatePassword(password);

    if (!isValid) {

      const messages = [];

      if (!requirements.hasUpperCase) messages.push('❌ ต้องมีตัวใหญ่');
      if (!requirements.hasLowerCase) messages.push('❌ ต้องมีตัวเล็ก');
      if (!requirements.hasNumber) messages.push('❌ ต้องมีตัวเลข');
      if (!requirements.validLength) messages.push('❌ 8-16 ตัวอักษร');

      Alert.alert('รหัสผ่านไม่ถูกต้อง', messages.join('\n'));
      return;
    }

    setIsLoadingSendCode(true);

    const result = await sendVerificationCodeForRegister(email);

    setIsLoadingSendCode(false);

    if (result.success) {

      setTempEmail(email);

      Alert.alert('สำเร็จ', `ส่งรหัสยืนยันไปที่ ${email}`);

      setMode('verify');

    } else {

      Alert.alert('เกิดข้อผิดพลาด', result.error);
    }
  };

  const handleVerifyCodeForRegistration = async () => {

    if (!verificationCode) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสยืนยัน');
      return;
    }

    const result = await verifyCode(tempEmail, verificationCode);

    if (result.success) {

      try {

        const { error } = await supabase
          .from('user')
          .insert([
            {
              email: tempEmail,
              first_name: firstName,
              last_name: lastName,
              password
            }
          ]);

        if (error) {
          Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างบัญชีได้');
          return;
        }

        Alert.alert('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว');

        resetForm();

        setMode('login');

      } catch (err) {

        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างบัญชีได้');
      }

    } else {

      Alert.alert('เกิดข้อผิดพลาด', result.error);
    }
  };

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

      Alert.alert('สำเร็จ', `รหัสยืนยันถูกส่งไปที่ ${email}`);

      setMode('resetPassword');

    } else {

      Alert.alert('เกิดข้อผิดพลาด', result.error);
    }
  };

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

  const handleSetNewPassword = async () => {

    if (!newPassword || !confirmPassword) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสผ่าน');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('เกิดข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    const result = await resetPassword(tempEmail, newPassword);

    if (result.success) {

      Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');

      resetForm();

      setMode('login');
    }
  };

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

  const onSubmit =
    mode === 'login'
      ? handleLogin
      : mode === 'register'
      ? handleRegister
      : mode === 'verify'
      ? handleVerifyCodeForRegistration
      : mode === 'forgotPassword'
      ? handleForgotPassword
      : mode === 'resetPassword'
      ? handleVerifyCodeForReset
      : handleSetNewPassword;

  return (

    <View style={styles.container}>

      {mode === 'login' && (
        <>

          <Text style={styles.title}>เข้าสู่ระบบ</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A1AAA6"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A1AAA6"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.button}>
            <Button
              title="Login"
              onPress={onSubmit}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.switchRow}>

            <Text style={styles.hintInline}>
              ยังไม่มีบัญชี?
            </Text>

            <TouchableOpacity
              onPress={() => setMode('register')}
            >
              <Text style={styles.switchInline}>
                ลงทะเบียน
              </Text>
            </TouchableOpacity>

          </View>

        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#F5F8F6'
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0B4A40',
    marginBottom: 40,
    letterSpacing: 1
  },

  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5E1',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 17,
    color: '#0B4A40'
  },

  button: {
    width: '100%',
    backgroundColor: '#0B4A40',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },

  hintInline: {
    color: '#8C9491',
    fontSize: 16
  },

  switchInline: {
    color: '#1D6B5C',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4
  },

  requirementsBox: {
    backgroundColor: '#EDF5F1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#1E6C5B'
  },

  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F3D34',
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
    color: '#9AA8A3',
    flex: 1
  },

  requirementMet: {
    color: '#1E6C5B',
    fontWeight: '500'
  },

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

  bottomLink: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#DCE7E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }

});