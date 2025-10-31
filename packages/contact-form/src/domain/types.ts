// Base form fields definition
export interface FormData {
  replyTo: string;
  subject: string;
  message: string;
}

// Form data with optional fields
// export type FormData = Partial<AllowedFormFields>;

// Rules definition
export interface InputRules {
  minLength: number;
  maxLength: number;
  required: boolean;
  isEmail?: boolean;
}

export type FormInput = {
  field: keyof FormData;
  value: string;
  rules: ValidationConstraints;
};
export interface InputError extends FormInput {
  type: 'validation';
  message: string;
}
// Possible error origins
export type ErrorType = 'validation' | 'network' | 'server' | 'system';

export type ValidationConstraints = Partial<InputRules>;

export type ValidatorConstraints = {
  [K in keyof FormData]: InputRules;
};

export type FormRules = {
  [K in keyof FormData]?: ValidationConstraints;
};

type SubmitOptions = {
  persistData?: boolean;
  debug?: boolean;
};

export interface SubmitProps {
  fields: FormData;
  options?: SubmitOptions;
}

export interface ValidationResponse {
  success: boolean;
  status: number; // 200 si pasa, 400 si falla
  message: string;
  type: 'validation';
  errors: InputError[] | null;
  data?: {
    fields?: FormData;
    rules?: ValidatorConstraints;
  };
}

/* export type FormError = {
  type: 'validation' | 'system';
  message: string;
  data?: unknown;
}; */

// Unified form response
export interface FormResponse {
  success: boolean;
  status: number;
  message: string;
  data?: {
    fields?: FormData | null;
    url?: string;
    rules?: ValidatorConstraints;
  };
  errors?:
    | InputError[]
    | Array<{
        type: ErrorType;
        message: string;
        data?: unknown;
      }>
    | null;
}

export interface FormConfig {
  rules: ValidatorConstraints;
  endPointPath: string;
}

export interface FormMainConfig extends FormConfig {
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
