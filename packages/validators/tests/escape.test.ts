import { describe, expect, it } from 'vitest';
import { escape } from '../src/escape';

describe('escape', () => {
  it('should escape HTML special characters', () => {
    expect(escape('<p>Test</p>')).toBe('&lt;p&gt;Test&lt;/p&gt;');
    expect(escape('Hello & World')).toBe('Hello &amp; World');
    expect(escape('"quoted" text')).toBe('&quot;quoted&quot; text');
    expect(escape("single 'quotes'")).toBe('single &#39;quotes&#39;');
  });

  it('should return the same string if no special characters are present', () => {
    expect(escape('Hello World')).toBe('Hello World');
    expect(escape('123')).toBe('123');
    expect(escape('')).toBe('');
  });

  it('should handle multiple special characters', () => {
    expect(escape('<a href="test">Link & More</a>')).toBe(
      '&lt;a href=&quot;test&quot;&gt;Link &amp; More&lt;/a&gt;'
    );
  });
});
