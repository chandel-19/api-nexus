function escapeSingleQuotes(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/'/g, `'\"'\"'`);
}

function buildQueryString(params = []) {
  const enabled = params.filter((p) => p.enabled && p.key);
  if (enabled.length === 0) return '';
  const query = enabled
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value ?? '')}`)
    .join('&');
  return query ? `?${query}` : '';
}

/**
 * Generate a cURL command from a request object
 * @param {object} request - Request object with method, url, headers, params, body, auth
 * @returns {string} - cURL command string
 */
export function generateCurl(request) {
  if (!request || !request.url) {
    throw new Error('Request URL is required to generate cURL');
  }

  const method = (request.method || 'GET').toUpperCase();
  const url = `${request.url}${buildQueryString(request.params || [])}`;

  const parts = ['curl'];

  if (method !== 'GET') {
    parts.push('-X', method);
  }

  // Headers
  const headers = (request.headers || []).filter((h) => h.enabled && h.key);
  headers.forEach((h) => {
    const headerValue = `${h.key}: ${h.value ?? ''}`;
    parts.push('-H', `'${escapeSingleQuotes(headerValue)}'`);
  });

  // Auth
  if (request.auth) {
    if (request.auth.type === 'bearer' && request.auth.token) {
      parts.push('-H', `'Authorization: Bearer ${escapeSingleQuotes(request.auth.token)}'`);
    } else if (request.auth.type === 'basic' && request.auth.username) {
      const user = escapeSingleQuotes(request.auth.username);
      const pass = escapeSingleQuotes(request.auth.password ?? '');
      parts.push('-u', `'${user}:${pass}'`);
    } else if (request.auth.type === 'apikey' && request.auth.key) {
      const headerValue = `${request.auth.key}: ${request.auth.value ?? ''}`;
      parts.push('-H', `'${escapeSingleQuotes(headerValue)}'`);
    }
  }

  // Body
  if (request.body && request.body.type && request.body.type !== 'none') {
    if (request.body.content) {
      parts.push('-d', `'${escapeSingleQuotes(request.body.content)}'`);
    }
  }

  parts.push(`'${escapeSingleQuotes(url)}'`);

  return parts.join(' ');
}
