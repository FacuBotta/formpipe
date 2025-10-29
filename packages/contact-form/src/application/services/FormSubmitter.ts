import { FormData as IFormData, SubmitterResponse } from 'src/domain/types';

export class FormSubmitter {
  constructor(private readonly url: string) {
    this.url = url;
  }

  async submit(data: IFormData): Promise<SubmitterResponse> {
    if (!this.url) {
      return {
        success: false,
        status: 400,
        response: {
          message: 'No endpoint URL provided',
          data: null,
          errors: [
            {
              type: 'system',
              message: `No endpoint URL found at ${this.url}`,
              data: this.url,
            },
          ],
        },
      };
    }

    if (!data.replyTo) {
      return {
        success: false,
        status: 401,
        response: {
          message: 'replyTo field is required',
          data: null,
          errors: [
            {
              type: 'validation',
              message: 'replyTo field is required',
              data: null,
            },
          ],
        },
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

      const responseData = (await sendEmailResult.json()) as SubmitterResponse;

      return {
        success: responseData.success,
        status: responseData.status,
        response: {
          data: responseData.response.data,
          errors: null,
          message: responseData.response.message,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        status: 500,
        response: {
          data: {
            message: 'Network error occurred while submitting the form',
            errors: [
              {
                type: 'system',
                message: 'Failed to submit form',
                data: error,
              },
            ],
          },
        },
      };
    }
  }
}
