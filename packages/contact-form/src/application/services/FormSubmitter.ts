interface SubmitterProps {
  replyTo: string;
  subject: string;
  message: string;
  url: string;
}

export class FormSubmitter {
  async submitForm(data: SubmitterProps): Promise<Response> {
    const url = data.url;

    try {
      if (!url) throw new Error('No URL provided for form submission');
      const response = fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return response;
    } catch (error) {
      throw new Error('Submission failed', { cause: error });
    }
  }
}
