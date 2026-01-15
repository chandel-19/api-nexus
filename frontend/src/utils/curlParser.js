/**
 * Parse a cURL command string and extract request details
 * @param {string} curlCommand - The cURL command string
 * @returns {object} Parsed request object with method, url, headers, body, params, auth
 */
export function parseCurl(curlCommand) {
  if (!curlCommand || typeof curlCommand !== 'string') {
    throw new Error('Invalid cURL command');
  }

  // Remove extra whitespace and normalize
  let command = curlCommand.trim().replace(/\s+/g, ' ');

  // Default values
  const result = {
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    body: { type: 'none', content: '' },
    auth: { type: 'none' }
  };

  // Extract URL (first quoted string or first URL-like string after curl)
  const urlMatch = command.match(/curl\s+(?:['"]?)(https?:\/\/[^\s'"]+)(?:['"]?)/i) ||
                   command.match(/curl\s+['"]([^'"]+)['"]/) ||
                   command.match(/curl\s+([^\s]+)/);
  
  if (urlMatch) {
    result.url = urlMatch[1] || urlMatch[2] || urlMatch[3];
  }

  // Extract method (-X or --request)
  const methodMatch = command.match(/-X\s+(\w+)|--request\s+(\w+)/i);
  if (methodMatch) {
    result.method = (methodMatch[1] || methodMatch[2]).toUpperCase();
  }

  // Extract headers (-H or --header)
  const headerRegex = /-H\s+['"]([^'"]+)['"]|--header\s+['"]([^'"]+)['"]|--header\s+([^\s]+)/gi;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(command)) !== null) {
    const headerValue = headerMatch[1] || headerMatch[2] || headerMatch[3];
    if (headerValue) {
      const colonIndex = headerValue.indexOf(':');
      if (colonIndex > 0) {
        const key = headerValue.substring(0, colonIndex).trim();
        const value = headerValue.substring(colonIndex + 1).trim();
        result.headers.push({ key, value, enabled: true });
      }
    }
  }

  // Extract data/body (-d or --data or --data-raw or --data-binary)
  const dataMatch = command.match(/-d\s+['"]([^'"]+)['"]|--data\s+['"]([^'"]+)['"]|--data-raw\s+['"]([^'"]+)['"]|--data-binary\s+['"]([^'"]+)['"]/i);
  if (dataMatch) {
    const data = dataMatch[1] || dataMatch[2] || dataMatch[3] || dataMatch[4];
    if (data) {
      // Try to parse as JSON
      try {
        JSON.parse(data);
        result.body = { type: 'json', content: data };
      } catch {
        // Check if it's form data (key=value format)
        if (data.includes('=') && !data.includes('{')) {
          result.body = { type: 'form', content: data };
        } else {
          result.body = { type: 'raw', content: data };
        }
      }
    }
  }

  // Extract form data (-F or --form)
  const formRegex = /-F\s+['"]([^'"]+)['"]|--form\s+['"]([^'"]+)['"]/gi;
  let formMatch;
  const formData = [];
  while ((formMatch = formRegex.exec(command)) !== null) {
    const formValue = formMatch[1] || formMatch[2];
    if (formValue) {
      formData.push(formValue);
    }
  }
  if (formData.length > 0) {
    result.body = { type: 'form', content: formData.join('&') };
  }

  // Extract query parameters from URL
  if (result.url) {
    const urlObj = new URL(result.url);
    urlObj.searchParams.forEach((value, key) => {
      result.params.push({ key, value, enabled: true });
    });
    // Remove query params from URL (we'll add them as params)
    result.url = urlObj.origin + urlObj.pathname;
  }

  // Extract Basic Auth (-u or --user)
  const authMatch = command.match(/-u\s+['"]?([^:\s]+):([^\s'"]+)['"]?|--user\s+['"]?([^:\s]+):([^\s'"]+)['"]?/i);
  if (authMatch) {
    const username = authMatch[1] || authMatch[3];
    const password = authMatch[2] || authMatch[4];
    result.auth = {
      type: 'basic',
      username: username || '',
      password: password || ''
    };
  }

  // Extract Bearer token from Authorization header
  const authHeader = result.headers.find(h => h.key.toLowerCase() === 'authorization');
  if (authHeader && authHeader.value.startsWith('Bearer ')) {
    result.auth = {
      type: 'bearer',
      token: authHeader.value.replace('Bearer ', '')
    };
    // Remove the Authorization header since we're using auth field
    result.headers = result.headers.filter(h => h.key.toLowerCase() !== 'authorization');
  }

  // Extract API Key from headers (common patterns)
  const apiKeyHeader = result.headers.find(h => 
    h.key.toLowerCase().includes('api') && h.key.toLowerCase().includes('key')
  );
  if (apiKeyHeader && !result.auth || result.auth.type === 'none') {
    result.auth = {
      type: 'apikey',
      key: apiKeyHeader.key,
      value: apiKeyHeader.value
    };
    result.headers = result.headers.filter(h => h.key !== apiKeyHeader.key);
  }

  // If method is POST/PUT/PATCH and no body specified, set body type to none
  if (['POST', 'PUT', 'PATCH'].includes(result.method) && result.body.type === 'none') {
    // Leave it as none - user can add body if needed
  }

  return result;
}
