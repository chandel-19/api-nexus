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

  // Tokenize command (handles simple quoted strings)
  const tokens = command.match(/"[^"]*"|'[^']*'|[^\s]+/g) || [];
  const cleanedTokens = tokens.map(t => t.replace(/^['"]|['"]$/g, ''));

  // Parse tokens for method/headers/body/url/auth
  const dataTokens = [];
  const formTokens = [];
  let skipNext = false;
  let pendingFlag = null;

  const takeNextValue = (flag, value) => {
    if (!value) return;
    if (flag === '-X' || flag === '--request') {
      result.method = value.toUpperCase();
    } else if (flag === '-H' || flag === '--header') {
      const colonIndex = value.indexOf(':');
      if (colonIndex > 0) {
        const key = value.substring(0, colonIndex).trim();
        const val = value.substring(colonIndex + 1).trim();
        result.headers.push({ key, value: val, enabled: true });
      }
    } else if (
      flag === '-d' || flag === '--data' || flag === '--data-raw' ||
      flag === '--data-binary' || flag === '--data-urlencode'
    ) {
      dataTokens.push(value);
    } else if (flag === '-F' || flag === '--form') {
      formTokens.push(value);
    } else if (flag === '-u' || flag === '--user') {
      const [username, password] = value.split(':');
      result.auth = {
        type: 'basic',
        username: username || '',
        password: password || ''
      };
    }
  };

  for (let i = 0; i < cleanedTokens.length; i++) {
    const token = cleanedTokens[i];
    if (i === 0 && token.toLowerCase() === 'curl') {
      continue;
    }
    if (pendingFlag) {
      takeNextValue(pendingFlag, token);
      pendingFlag = null;
      continue;
    }
    if (token.startsWith('-')) {
      // Flags that take a value
      if ([
        '-X', '--request', '-H', '--header', '-d', '--data', '--data-raw',
        '--data-binary', '--data-urlencode', '-F', '--form', '-u', '--user'
      ].includes(token)) {
        pendingFlag = token;
        continue;
      }
      continue;
    }
    // First non-flag token is the URL
    if (!result.url) {
      result.url = token;
    }
  }

  // Build body from data/form tokens
  if (formTokens.length > 0) {
    result.body = { type: 'form', content: formTokens.join('&') };
  } else if (dataTokens.length > 0) {
    const data = dataTokens.join('&');
    try {
      JSON.parse(data);
      result.body = { type: 'json', content: data };
    } catch {
      if (data.includes('=') && !data.includes('{')) {
        result.body = { type: 'form', content: data };
      } else {
        result.body = { type: 'raw', content: data };
      }
    }
    // If body present and method not set, default to POST
    if (result.method === 'GET') {
      result.method = 'POST';
    }
  }

  // Extract query parameters from URL (only if URL is valid and does not contain variables)
  if (result.url) {
    const hasTemplateVars = result.url.includes('{{') || result.url.includes('}}');
    if (!hasTemplateVars) {
      try {
        // If URL has no scheme, skip parsing to avoid invalid URL errors
        const urlObj = new URL(result.url);
        urlObj.searchParams.forEach((value, key) => {
          result.params.push({ key, value, enabled: true });
        });
        // Remove query params from URL (we'll add them as params)
        result.url = urlObj.origin + urlObj.pathname;
      } catch {
        // Leave URL as-is if parsing fails
      }
    }
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
