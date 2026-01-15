/**
 * Substitute environment variables in request data
 * Supports {{variable_name}} syntax like Postman
 * @param {string} text - Text that may contain variables
 * @param {object} env - Environment object with variables array
 * @returns {string} - Text with variables substituted
 */
export function substituteVariables(text, env) {
  if (!text || typeof text !== 'string' || !env || !env.variables) {
    return text;
  }

  let result = text;
  
  // Create a map of enabled variables (handle both enabled: true and enabled: undefined)
  const varMap = {};
  env.variables.forEach(variable => {
    // Consider variable enabled if enabled is not explicitly false
    if (variable.enabled !== false && variable.key) {
      const key = variable.key.trim();
      if (key) {
        varMap[key] = variable.value || '';
        // Also store lowercase for case-insensitive matching
        varMap[key.toLowerCase()] = variable.value || '';
      }
    }
  });

  // Replace {{variable_name}} with actual values
  // Support variable names with letters, numbers, underscores, hyphens, and dots
  result = result.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (match, varName) => {
    // Try exact match first, then case-insensitive
    let value = varMap[varName];
    if (value === undefined) {
      value = varMap[varName.toLowerCase()];
    }
    if (value !== undefined) {
      return value;
    }
    // If variable not found, return the original match (don't substitute)
    console.warn(`Environment variable "${varName}" not found. Available variables:`, Object.keys(varMap));
    return match;
  });

  return result;
}

/**
 * Substitute environment variables in a request object
 * @param {object} request - Request object with url, headers, params, body, auth
 * @param {object} env - Environment object with variables
 * @returns {object} - Request object with variables substituted
 */
export function substituteRequestVariables(request, env) {
  if (!env || !env.variables || env.variables.length === 0) {
    return request;
  }

  const substituted = { ...request };

  // Substitute in URL
  if (substituted.url) {
    substituted.url = substituteVariables(substituted.url, env);
  }

  // Substitute in headers
  if (substituted.headers && Array.isArray(substituted.headers)) {
    substituted.headers = substituted.headers.map(header => ({
      ...header,
      key: substituteVariables(header.key || '', env),
      value: substituteVariables(header.value || '', env)
    }));
  }

  // Substitute in params
  if (substituted.params && Array.isArray(substituted.params)) {
    substituted.params = substituted.params.map(param => ({
      ...param,
      key: substituteVariables(param.key || '', env),
      value: substituteVariables(param.value || '', env)
    }));
  }

  // Substitute in body content
  if (substituted.body && substituted.body.content) {
    substituted.body = {
      ...substituted.body,
      content: substituteVariables(substituted.body.content, env)
    };
  }

  // Substitute in auth
  if (substituted.auth) {
    const auth = { ...substituted.auth };
    if (auth.token) {
      auth.token = substituteVariables(auth.token, env);
    }
    if (auth.username) {
      auth.username = substituteVariables(auth.username, env);
    }
    if (auth.password) {
      auth.password = substituteVariables(auth.password, env);
    }
    if (auth.key) {
      auth.key = substituteVariables(auth.key, env);
    }
    if (auth.value) {
      auth.value = substituteVariables(auth.value, env);
    }
    substituted.auth = auth;
  }

  return substituted;
}
