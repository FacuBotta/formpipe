import { FormData } from 'src/domain/types';

interface SubmitterProps extends FormData {
  url: string;
}

export class FormSubmitter {
  async submit(data: SubmitterProps): Promise<Response> {
    if (!data.url) {
      throw new Error('No URL provided for form submission');
    }

    if (!data.replyTo || !data.subject || !data.message) {
      throw new Error('Missing required form fields');
    }

    try {
      const response = await fetch(data.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyTo: data.replyTo,
          subject: data.subject,
          message: data.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during form submission');
    }
  }
}
