/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormSubmitter } from '../../src/application/services/FormSubmitter';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const validFormData = {
  replyTo: 'test@example.com',
  subject: 'Test Subject',
  message: 'This is a test message',
  url: 'http://example.com/submit',
};

describe('FormSubmitter', () => {
  let submitter: FormSubmitter;

  beforeEach(() => {
    submitter = new FormSubmitter();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submit', () => {
    it('should submit form successfully with valid data', async () => {
      const responseData = { success: true };
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await submitter.submit(validFormData);

      expect(result).toEqual({
        success: true,
        status: 200,
        data: responseData,
      });
      expect(mockFetch).toHaveBeenCalledWith(validFormData.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyTo: validFormData.replyTo,
          fields: [
            { key: 'subject', value: validFormData.subject },
            { key: 'message', value: validFormData.message },
          ],
        }),
      });
    });

    it('should return error response when URL is missing', async () => {
      const invalidData = {
        ...validFormData,
        url: '',
      };

      const result = await submitter.submit(invalidData);

      expect(result).toEqual({
        success: false,
        status: 500,
        errors: {
          type: 'system',
          message: 'No URL provided for form submission',
        },
      });
    });

    it('should return error response when URL is undefined', async () => {
      const invalidData = {
        replyTo: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message',
        url: undefined as any,
      };

      const result = await submitter.submit(invalidData);

      expect(result).toEqual({
        success: false,
        status: 500,
        errors: {
          type: 'system',
          message: 'No URL provided for form submission',
        },
      });
    });

    it('should return error response when replyTo is missing', async () => {
      const invalidData = {
        ...validFormData,
        replyTo: '',
      };

      const result = await submitter.submit(invalidData);

      expect(result).toEqual({
        success: false,
        status: 500,
        errors: {
          type: 'system',
          message: 'Missing required form fields',
        },
      });
    });

    it('should return error response when HTTP response is not ok', async () => {
      const responseData = { error: 'Bad Request' };
      const mockResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve(responseData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await submitter.submit(validFormData);

      expect(result).toEqual({
        success: false,
        status: 400,
        data: responseData,
      });
    });

    it('should return error response when HTTP response is 500', async () => {
      const responseData = { error: 'Internal Server Error' };
      const mockResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve(responseData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await submitter.submit(validFormData);

      expect(result).toEqual({
        success: false,
        status: 500,
        data: responseData,
      });
    });

    it('should return error response when fetch fails with network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const result = await submitter.submit(validFormData);

      expect(result).toEqual({
        success: false,
        status: 500,
        errors: {
          type: 'system',
          message: 'Unknown error occurred during form submission',
          details: networkError,
        },
      });
    });

    it('should return error response when fetch fails with non-Error object', async () => {
      mockFetch.mockRejectedValue('String error');

      const result = await submitter.submit(validFormData);

      expect(result).toEqual({
        success: false,
        status: 500,
        errors: {
          type: 'system',
          message: 'Unknown error occurred during form submission',
          details: 'String error',
        },
      });
    });

    it('should handle successful response with different status codes', async () => {
      const responseData = { id: 123 };
      const mockResponse = {
        ok: true,
        status: 201,
        json: () => Promise.resolve(responseData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await submitter.submit(validFormData);

      expect(result).toEqual({
        success: true,
        status: 201,
        data: responseData,
      });
    });

    it('should send correct headers and body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await submitter.submit(validFormData);

      expect(mockFetch).toHaveBeenCalledWith(
        validFormData.url,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            replyTo: validFormData.replyTo,
            fields: [
              { key: 'subject', value: validFormData.subject },
              { key: 'message', value: validFormData.message },
            ],
          }),
        })
      );
    });
  });
});
