import { describe, expect, it } from 'vitest';
import { sanitize } from '../src/sanitaze';

describe('sanitize', () => {
  it('should remove HTML tags while keeping their content', () => {
    expect(sanitize('<p>Hello World</p>')).toBe('Hello World');
    expect(sanitize('<div><span>Nested</span> tags</div>')).toBe('Nested tags');
    expect(sanitize('<strong>Bold</strong> and <em>italic</em>')).toBe(
      'Bold and italic'
    );
  });

  it('should remove script tags and their content', () => {
    expect(sanitize('<script>alert("XSS")</script>Hello')).toBe('Hello');
    expect(sanitize('Text<script>malicious()</script>More')).toBe('TextMore');
    expect(sanitize('<script src="evil.js"></script>Content')).toBe('Content');
  });

  it('should handle HTML entities correctly', () => {
    expect(sanitize('&lt;div&gt;')).toBe('<div>');
    expect(sanitize('&amp; symbol')).toBe('& symbol');
    expect(sanitize('&quot;quoted&quot;')).toBe('"quoted"');
    expect(sanitize('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });

  it('should handle complex mixed content', () => {
    const input = `
      <div class="container">
        <h1>Title &amp; Subtitle</h1>
        <script>alert('test');</script>
        <p>Hello, &quot;World&quot;!</p>
      </div>
    `;
    const expected = 'Title & Subtitle Hello, "World"!';
    expect(sanitize(input).trim().replace(/\s+/g, ' ')).toBe(expected);
  });

  it('should handle invalid inputs gracefully', () => {
    expect(sanitize('')).toBe('');
    // @ts-expect-error Testing invalid input
    expect(sanitize(null)).toBe('');
    // @ts-expect-error Testing invalid input
    expect(sanitize(undefined)).toBe('');
    expect(sanitize('<incomplete>tag')).toBe('tag');
  });

  it('should handle special cases', () => {
    expect(sanitize('Line1<br>Line2')).toBe('Line1Line2');
    expect(sanitize('<p>Text with multiple     spaces</p>')).toBe(
      'Text with multiple     spaces'
    );
    expect(sanitize('Mixed<br/>breaks<br />test')).toBe('Mixedbreakstest');
  });
});
