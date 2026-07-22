export interface ValidationResult {
  [key: string]: string;
}

export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === "") {
    return `${fieldName} is required`;
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return "Phone number is required";
  
  // Basic phone validation - can be customized for Ethiopian format
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  if (!phoneRegex.test(phone)) {
    return "Please enter a valid phone number";
  }
  
  return null;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
};

export const validateTerms = (agreed: boolean): string | null => {
  if (!agreed) {
    return "You must agree to the terms and conditions";
  }
  return null;
};
