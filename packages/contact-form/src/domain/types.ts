export interface FormData {
  replyTo: string;
  name?: string;
  subject: string;
  message: string;
  phoneNumber?: string;
}

export type FormInput = {
  field: keyof FormData;
  value: string;
  rules: ValidationConstraints;
};

export type PhoneValidationMode = 'loose' | 'strict' | 'e164';

export interface InputRules {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  isEmail?: boolean;
  phoneValidationMode?: PhoneValidationMode;
}

export interface InputError extends FormInput {
  type: 'validation';
  message: string;
}
export type ErrorType = 'validation' | 'network' | 'server' | 'system';

export type ValidationProps = Partial<FormData>;

export type ValidationConstraints = Partial<InputRules>;

export type ValidatorConstraints = {
  // eslint-disable-next-line no-unused-vars
  [K in keyof FormData]: InputRules;
};

export type FormRules = {
  // eslint-disable-next-line no-unused-vars
  [K in keyof FormData]: ValidationConstraints;
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
  status: number;
  message: string;
  errors: InputError[] | null;
  data?: {
    fields?: Partial<FormData>;
    rules?: ValidatorConstraints;
  };
}
export interface FormResponse {
  success: boolean;
  status: number;
  message: string;
  data?: {
    fields?: Partial<FormData> | null;
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
  rateLimit: number;
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
  useLocalPhpMailer: boolean;
  debug: boolean;
}
