import {
  FormResponse,
  FormData as IFormData,
  SystemError,
} from 'src/domain/types';

export class FormSubmitter {
  constructor(private readonly url: string) {
    this.url = url;
  }

  async submit(data: IFormData): Promise<FormResponse> {
    if (!this.url) {
      return this.createErrorResponse({
        message: 'No URL provided for form submission',
        type: 'system',
      });
    }

    if (!data.replyTo) {
      return this.createErrorResponse({
        message: 'Missing required form fields',
        type: 'system',
      });
    }
    const fields = [];

    for (const key of Object.keys(data)) {
      if (key !== 'replyTo' && data[key as keyof IFormData]) {
        fields.push({ key, value: data[key as keyof IFormData] });
      }
    }

    const formFields = [];
    for (const key of Object.keys(data)) {
      if (key !== 'replyTo' && data[key as keyof IFormData]) {
        formFields.push({
          key,
          value: data[key as keyof IFormData] as string,
        });
      }
    }

    const body = JSON.stringify({
      replyTo: data.replyTo,
      fields: formFields,
    });

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const responseData = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: responseData,
      };
    } catch (error: unknown) {
      return this.createErrorResponse({
        message: 'Unknown error occurred during form submission',
        type: 'system',
        data: { error, url: this.url },
      });
    }
  }

  private createErrorResponse(error: SystemError): FormResponse {
    return {
      success: false,
      status: 500,
      errors: error,
    };
  }
}
