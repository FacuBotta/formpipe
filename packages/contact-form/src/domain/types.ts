// Base form fields definition
export interface FormFields {
  replyTo: string;
  subject: string;
  message: string;
}

// Form data with optional fields
export type FormData = Partial<FormFields>;

// Rules definition
export interface InputRules {
  minLength: number;
  maxLength: number;
  required: boolean;
  isEmail?: boolean;
}

export type ValidationConstraints = Partial<InputRules>;

export type FormRules = {
  [K in keyof FormFields]: InputRules;
};

export type Rules = {
  [K in keyof FormFields]?: ValidationConstraints;
};

type SubmitOptions = {
  persistData?: boolean;
  sendConfirmation?: boolean;
  htmlTemplate?: string;
  textTemplate?: string;
};

export interface SubmitProps extends FormData {
  options?: SubmitOptions;
}

export interface ValidationError {
  message: string;
  field: keyof FormFields;
  value: string;
  type: 'validation';
  constraints?: ValidationConstraints;
}

export interface SystemError {
  message: string;
  type: 'system';
  details?: unknown;
}

export type FormError = ValidationError | SystemError;

export interface FormResponse {
  success: boolean;
  data?: FormData;
  status: number;
  error?: FormError | FormError[];
}
