import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormSubmitter } from '../../src/application/services/FormSubmitter';
import { FormData } from '../../src/domain/types';

const mockUrl = 'https://example.com/contact-form.php';

const sampleData: FormData = {
  replyTo: 'user@example.com',
  subject: 'Hello',
  message: 'Test message',
};

describe('FormSubmitter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return error if no URL is provided', async () => {
    const submitter = new FormSubmitter('');
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.errors?.[0].message).toContain('No endpoint URL provided');
  });

  it('should handle successful submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: 'Sent!' }),
        })
      )
    );

    const submitter = new FormSubmitter(mockUrl);
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.message).toBe('Sent!');
    expect(result.data?.url).toBe(mockUrl);
    expect(result.errors).toBeNull();
  });

  it('should handle validation error from backend (400)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            errors: [
              { field: 'email', message: 'Invalid email' },
              { field: 'subject', message: 'Too short' },
            ],
          }),
        })
      )
    );

    const submitter = new FormSubmitter(mockUrl);
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toBe('Validation failed');
    expect(result.errors).toHaveLength(2);
  });

  it('should handle rate limit (429)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ error: 'Too many requests' }),
        })
      )
    );

    const submitter = new FormSubmitter(mockUrl);
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(429);
    expect(result.errors?.[0].message).toContain('Too many requests');
  });

  it('should handle generic server error (500)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Server Error' }),
        })
      )
    );

    const submitter = new FormSubmitter(mockUrl);
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.errors?.[0].message).toContain('Internal Server Error');
  });

  it('should handle invalid JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Unexpected token');
          },
        })
      )
    );

    const submitter = new FormSubmitter(mockUrl);
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(200); // comes from the HTTP response
    expect(result.errors?.[0].message).toContain('Invalid JSON response');
  });

  it('should handle unexpected response structure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ foo: 'bar' }), // missing success key
        })
      )
    );

    const submitter = new FormSubmitter(mockUrl);
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.errors?.[0].message).toContain(
      'Unexpected response structure'
    );
  });

  it('should handle network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network down')))
    );

    const submitter = new FormSubmitter(mockUrl);
    const result = await submitter.submit(sampleData);

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.errors?.[0].type).toBe('network');
    expect(result.errors?.[0].message).toContain('Network error');
  });
});
