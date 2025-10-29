// Base form fields definition
export interface AllowedFormFields {
  replyTo: string;
  subject: string;
  message: string;
}

// Form data with optional fields
export type FormData = Partial<AllowedFormFields>;

// Rules definition
export interface InputRules {
  minLength: number;
  maxLength: number;
  required: boolean;
  isEmail?: boolean;
}

export type FormInput = {
  field: keyof AllowedFormFields;
  value: string;
  rules: ValidationConstraints;
};
export interface InputError extends FormInput {
  message: string;
}

export type ValidationConstraints = Partial<InputRules>;

export type ValidatorConstraints = {
  [K in keyof AllowedFormFields]: InputRules;
};

export type FormRules = {
  [K in keyof AllowedFormFields]?: ValidationConstraints;
};

type SubmitOptions = {
  persistData?: boolean;
  debug?: boolean;
};

export interface SubmitProps {
  fields: FormData;
  options?: SubmitOptions;
}

export interface ValidatorResponse {
  success: boolean;
  type: 'validation';
  data: FormInput[];
}

export interface SystemError {
  status: 500;
  type: 'system';
  message: string;
  data?: unknown;
}
export type SubmitterResponse = {
  success: boolean;
  status: number;
  response: {
    data: unknown;
    errors?: FormError[] | null;
    message?: string;
  };
};
export type FormError = {
  type: 'validation' | 'system';
  message: string;
  data?: unknown;
};

export interface FormResponse {
  success: boolean;
  status: number;
  response: {
    data: unknown;
    errors: unknown[];
    message?: string;
  };
}
export type SubmitResponse = FormResponse;

export interface FormConfig {
  rules: ValidatorConstraints;
  endPointPath: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  from: string;
  to: string;
  sendConfirmation: boolean;
  rateLimit: number;
  debug: boolean;
}
