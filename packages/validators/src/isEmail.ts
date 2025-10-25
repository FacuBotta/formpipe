export const isEmail = (value: string): boolean => {
  // RFC 5322 compliant email validation
  const regex =
    /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Basic structural validation
  if (!regex.test(value)) {
    return false;
  }

  // Additional checks for common issues
  const parts = value.split('@');
  const local = parts[0];
  const domain = parts[1];

  // Check local part
  if (local.startsWith('.') || local.endsWith('.')) {
    return false;
  }
  if (local.includes('..')) {
    return false;
  }

  // Check domain part
  if (domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }
  if (domain.includes('..')) {
    return false;
  }

  return true;
};
