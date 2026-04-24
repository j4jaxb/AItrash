/**
 * Password Validator
 * ตรวจสอบว่ารหัสผ่านตรงตามเงื่อนไข:
 * - ต้องมีตัวใหญ่ (A-Z)
 * - ต้องมีตัวเล็ก (a-z)
 * - ต้องมีเลข (0-9)
 * - ต้องมี 8-16 ตัวอักษร
 */

export const validatePassword = (password) => {
  const requirements = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    validLength: password.length >= 8 && password.length <= 16
  };

  return {
    isValid: requirements.hasUpperCase && requirements.hasLowerCase && requirements.hasNumber && requirements.validLength,
    requirements
  };
};

export const getPasswordRequirements = () => {
  return [
    { key: 'uppercase', label: 'ต้องมีตัวใหญ่ (A-Z)', regex: /[A-Z]/ },
    { key: 'lowercase', label: 'ต้องมีตัวเล็ก (a-z)', regex: /[a-z]/ },
    { key: 'number', label: 'ต้องมีเลข (0-9)', regex: /[0-9]/ },
    { key: 'length', label: '8-16 ตัวอักษร', minLength: 8, maxLength: 16 }
  ];
};

export const checkPasswordRequirement = (password, requirementKey) => {
  const requirements = getPasswordRequirements();
  const requirement = requirements.find(r => r.key === requirementKey);
  
  if (!requirement) return false;
  
  if (requirement.key === 'length') {
    return password.length >= requirement.minLength && password.length <= requirement.maxLength;
  }
  
  return requirement.regex.test(password);
};

export const getPasswordStrength = (password) => {
  const { requirements } = validatePassword(password);
  const passedCount = Object.values(requirements).filter(v => v).length;
  
  if (passedCount <= 2) return 'weak';
  if (passedCount <= 3) return 'medium';
  return 'strong';
};
