/**
 * Escapes HTML special characters in a string
 * @param value The string to escape
 * @returns The escaped string
 */
export function escapeHtml(value: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}
