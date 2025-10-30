import { FormData as IFormData, SubmitResponse } from 'src/domain/types';

export class FormSubmitter {
  constructor(private readonly url: string) {
    this.url = url;
  }

  async submit(data: IFormData): Promise<SubmitResponse> {
    if (!this.url) {
      return {
        success: false,
        status: 400,
        message: 'No endpoint URL provided',
        data: {
          fields: data,
          url: this.url,
        },
        errors: [
          {
            type: 'system',
            message: `No endpoint URL found at ${this.url}`,
            data: this.url,
          },
        ],
      };
    }

    if (!data.replyTo) {
      return {
        success: false,
        status: 401,
        message: 'replyTo field is required',
        data: {
          fields: data,
          url: this.url,
        },
        errors: [
          {
            type: 'validation',
            message: 'replyTo field is required',
            data: data.replyTo,
          },
        ],
      };
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
      const sendEmailResult = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const responseData: SubmitResponse = await sendEmailResult.json();
      console.log(responseData);
      return {
        success: responseData.success,
        status: 200,
        message: responseData.message,
        data: {
          fields: data,
          url: this.url,
        },
        errors: responseData.errors,
      };
    } catch (error: unknown) {
      return {
        success: false,
        status: 500,
        message: 'Network error occurred while submitting the form',
        data: {
          fields: data,
          url: this.url,
        },
        errors: [
          {
            type: 'system',
            message: 'Failed to submit form',
            data: error,
          },
        ],
      };
    }
  }
}
