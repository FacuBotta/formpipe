import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/escapeHtml';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<p>Test</p>')).toBe('&lt;p&gt;Test&lt;/p&gt;');
    expect(escapeHtml('Hello & World')).toBe('Hello &amp; World');
    expect(escapeHtml('"quoted" text')).toBe('&quot;quoted&quot; text');
    expect(escapeHtml("single 'quotes'")).toBe('single &#39;quotes&#39;');
  });

  it('should return the same string if no special characters are present', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
    expect(escapeHtml('123')).toBe('123');
    expect(escapeHtml('')).toBe('');
  });

  it('should handle multiple special characters', () => {
    expect(escapeHtml('<a href="test">Link & More</a>')).toBe(
      '&lt;a href=&quot;test&quot;&gt;Link &amp; More&lt;/a&gt;'
    );
  });
});
