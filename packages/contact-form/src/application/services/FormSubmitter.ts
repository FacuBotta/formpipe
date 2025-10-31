import { ErrorType, FormData, SubmitResponse } from 'src/domain/types';

export class FormSubmitter {
  constructor(private readonly url: string) {}

  async submit(data: FormData): Promise<SubmitResponse> {
    if (!this.url) {
      return this.errorResponse(
        400,
        'No endpoint URL provided',
        'system',
        this.url
      );
    }

    const body = JSON.stringify({
      replyTo: data.replyTo,
      fields: Object.entries(data)
        .filter(([key]) => key !== 'replyTo')
        .map(([key, value]) => ({ key, value: String(value ?? '') })),
    });

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any;
      try {
        payload = await response.json();
      } catch {
        return this.errorResponse(
          response.status,
          'Invalid JSON response from server',
          'server',
          {
            payload,
            response,
          }
        );
      }

      // --- Handle known error structures ---
      if (!response.ok) {
        switch (response.status) {
          case 400:
            // Validation errors (from backend)
            if (Array.isArray(payload.errors)) {
              return {
                success: false,
                status: 400,
                message: 'Validation failed',
                data: { fields: data, url: this.url },
                errors: payload.errors,
              };
            }
            return this.errorResponse(
              400,
              payload.error || 'Bad Request',
              'server',
              payload
            );

          case 429:
            return this.errorResponse(
              429,
              payload.error || 'Too many requests',
              'server',
              payload
            );

          case 500:
          default:
            return this.errorResponse(
              500,
              payload.error || 'Server error',
              'server',
              payload
            );
        }
      }

      // --- Success case ---
      if (payload.success) {
        return {
          success: true,
          status: 200,
          message: payload.message || 'Form submitted successfully',
          data: { fields: data, url: this.url },
          errors: null,
        };
      }

      // Unexpected response structure
      return this.errorResponse(
        500,
        'Unexpected response structure',
        'server',
        payload
      );
    } catch (error: unknown) {
      return this.errorResponse(0, 'Network error occurred', 'network', {
        message: error instanceof Error ? error.message : error,
      });
    }
  }

  private errorResponse(
    status: number,
    message: string,
    type: ErrorType,
    data?: unknown
  ): SubmitResponse {
    return {
      success: false,
      status: status || 500,
      message,
      data: { fields: null, url: this.url },
      errors: [
        {
          type,
          message,
          data,
        },
      ],
    };
  }
}
