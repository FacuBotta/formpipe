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

export interface FormError {
  message: string;
  input: Partial<FormData>;
  status?: number;
}
