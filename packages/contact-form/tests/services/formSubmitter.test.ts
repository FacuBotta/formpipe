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

  describe('submitForm', () => {
    it('should submit form successfully with valid data', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await submitter.submitForm(validFormData);

      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(validFormData.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyTo: validFormData.replyTo,
          subject: validFormData.subject,
          message: validFormData.message,
        }),
      });
    });

    it('should throw error when URL is missing', async () => {
      const invalidData = {
        ...validFormData,
        url: '',
      };

      await expect(submitter.submitForm(invalidData)).rejects.toThrow(
        'No URL provided for form submission'
      );
    });

    it('should throw error when URL is undefined', async () => {
      const invalidData = {
        replyTo: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message',
        url: undefined as any,
      };

      await expect(submitter.submitForm(invalidData)).rejects.toThrow(
        'No URL provided for form submission'
      );
    });

    it('should throw error when replyTo is missing', async () => {
      const invalidData = {
        ...validFormData,
        replyTo: '',
      };

      await expect(submitter.submitForm(invalidData)).rejects.toThrow(
        'Missing required form fields'
      );
    });

    it('should throw error when subject is missing', async () => {
      const invalidData = {
        ...validFormData,
        subject: '',
      };

      await expect(submitter.submitForm(invalidData)).rejects.toThrow(
        'Missing required form fields'
      );
    });

    it('should throw error when message is missing', async () => {
      const invalidData = {
        ...validFormData,
        message: '',
      };

      await expect(submitter.submitForm(invalidData)).rejects.toThrow(
        'Missing required form fields'
      );
    });

    it('should throw error when HTTP response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(submitter.submitForm(validFormData)).rejects.toThrow(
        'HTTP error! status: 400'
      );
    });

    it('should throw error when HTTP response is 500', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(submitter.submitForm(validFormData)).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });

    it('should throw error when fetch fails with network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(submitter.submitForm(validFormData)).rejects.toThrow(
        'Network error'
      );
    });

    it('should throw unknown error when fetch fails with non-Error object', async () => {
      mockFetch.mockRejectedValue('String error');

      await expect(submitter.submitForm(validFormData)).rejects.toThrow(
        'Unknown error occurred during form submission'
      );
    });

    it('should handle successful response with different status codes', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 123 }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await submitter.submitForm(validFormData);

      expect(result).toBe(mockResponse);
      expect(result.status).toBe(201);
    });

    it('should send correct headers and body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await submitter.submitForm(validFormData);

      expect(mockFetch).toHaveBeenCalledWith(
        validFormData.url,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            replyTo: validFormData.replyTo,
            subject: validFormData.subject,
            message: validFormData.message,
          }),
        })
      );
    });
  });
});
