export interface FormData {
  replyTo: string;
  subject: string;
  message: string;
}

export interface InputRules {
  minLength: number;
  maxLength: number;
  required?: boolean;
}

// Tipo parcial para constraints en errores de validación
export type ValidationConstraints = Partial<InputRules>;

export interface FormRules {
  replyTo: InputRules;
  subject: InputRules;
  message: InputRules;
}

type SubmitOptions = {
  persistData?: boolean;
};

export interface SubmitProps extends FormData {
  options?: SubmitOptions;
}

export interface ValidationError {
  message: string;
  field: keyof FormData;
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
