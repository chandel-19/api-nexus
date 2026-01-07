// Mock data for Postman clone - will be replaced with actual API calls

export const mockUser = {
  user_id: 'user_123',
  email: 'demo@example.com',
  name: 'Demo User',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo'
};

export const mockOrganizations = [
  {
    org_id: 'org_1',
    name: 'My Workspace',
    type: 'personal',
    members: [mockUser.user_id]
  },
  {
    org_id: 'org_2',
    name: 'Acme Corp',
    type: 'team',
    members: [mockUser.user_id, 'user_124', 'user_125']
  },
  {
    org_id: 'org_3',
    name: 'StartupXYZ',
    type: 'team',
    members: [mockUser.user_id, 'user_126']
  }
];

export const mockCollections = [
  {
    collection_id: 'col_1',
    org_id: 'org_1',
    name: 'User API',
    description: 'User management endpoints',
    color: '#3B82F6',
    created_at: new Date('2024-01-15').toISOString()
  },
  {
    collection_id: 'col_2',
    org_id: 'org_1',
    name: 'Products API',
    description: 'Product catalog endpoints',
    color: '#10B981',
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    collection_id: 'col_3',
    org_id: 'org_2',
    name: 'Payment Gateway',
    description: 'Payment processing',
    color: '#F59E0B',
    created_at: new Date('2024-02-01').toISOString()
  }
];

export const mockRequests = [
  {
    request_id: 'req_1',
    collection_id: 'col_1',
    org_id: 'org_1',
    name: 'Get All Users',
    method: 'GET',
    url: 'https://api.example.com/users',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [{ key: 'page', value: '1', enabled: true }, { key: 'limit', value: '10', enabled: true }],
    body: { type: 'none', content: '' },
    auth: { type: 'bearer', token: '' },
    created_at: new Date('2024-01-15').toISOString()
  },
  {
    request_id: 'req_2',
    collection_id: 'col_1',
    org_id: 'org_1',
    name: 'Create User',
    method: 'POST',
    url: 'https://api.example.com/users',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [],
    body: {
      type: 'json',
      content: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      }, null, 2)
    },
    auth: { type: 'bearer', token: 'your_token_here' },
    created_at: new Date('2024-01-16').toISOString()
  },
  {
    request_id: 'req_3',
    collection_id: 'col_2',
    org_id: 'org_1',
    name: 'Get Product',
    method: 'GET',
    url: 'https://api.example.com/products/123',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [],
    body: { type: 'none', content: '' },
    auth: { type: 'apikey', key: 'X-API-Key', value: 'abc123' },
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    request_id: 'req_4',
    collection_id: 'col_2',
    org_id: 'org_1',
    name: 'Update Product',
    method: 'PUT',
    url: 'https://api.example.com/products/123',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [],
    body: {
      type: 'json',
      content: JSON.stringify({
        name: 'Updated Product',
        price: 99.99,
        stock: 50
      }, null, 2)
    },
    auth: { type: 'apikey', key: 'X-API-Key', value: 'abc123' },
    created_at: new Date('2024-01-21').toISOString()
  },
  {
    request_id: 'req_5',
    collection_id: 'col_3',
    org_id: 'org_2',
    name: 'Process Payment',
    method: 'POST',
    url: 'https://api.stripe.com/v1/charges',
    headers: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded', enabled: true }],
    params: [],
    body: {
      type: 'form',
      content: 'amount=2000&currency=usd&source=tok_visa'
    },
    auth: { type: 'basic', username: 'sk_test_123', password: '' },
    created_at: new Date('2024-02-01').toISOString()
  }
];

export const mockHistory = [
  {
    history_id: 'hist_1',
    request_id: 'req_1',
    user_id: mockUser.user_id,
    org_id: 'org_1',
    method: 'GET',
    url: 'https://api.example.com/users?page=1&limit=10',
    status: 200,
    time: 245,
    timestamp: new Date('2024-03-15T10:30:00').toISOString()
  },
  {
    history_id: 'hist_2',
    request_id: 'req_2',
    user_id: mockUser.user_id,
    org_id: 'org_1',
    method: 'POST',
    url: 'https://api.example.com/users',
    status: 201,
    time: 312,
    timestamp: new Date('2024-03-15T11:15:00').toISOString()
  },
  {
    history_id: 'hist_3',
    request_id: 'req_3',
    user_id: mockUser.user_id,
    org_id: 'org_1',
    method: 'GET',
    url: 'https://api.example.com/products/123',
    status: 200,
    time: 189,
    timestamp: new Date('2024-03-15T14:20:00').toISOString()
  }
];

export const mockEnvironments = [
  {
    env_id: 'env_1',
    org_id: 'org_1',
    name: 'Development',
    variables: [
      { key: 'BASE_URL', value: 'https://dev.api.example.com', enabled: true },
      { key: 'API_KEY', value: 'dev_key_123', enabled: true },
      { key: 'TIMEOUT', value: '5000', enabled: true }
    ]
  },
  {
    env_id: 'env_2',
    org_id: 'org_1',
    name: 'Production',
    variables: [
      { key: 'BASE_URL', value: 'https://api.example.com', enabled: true },
      { key: 'API_KEY', value: 'prod_key_456', enabled: true },
      { key: 'TIMEOUT', value: '3000', enabled: true }
    ]
  },
  {
    env_id: 'env_3',
    org_id: 'org_2',
    name: 'Staging',
    variables: [
      { key: 'BASE_URL', value: 'https://staging.acme.com', enabled: true },
      { key: 'SECRET_KEY', value: 'staging_secret', enabled: true }
    ]
  }
];

export const mockResponse = {
  status: 200,
  statusText: 'OK',
  time: 245,
  size: '1.2 KB',
  headers: {
    'content-type': 'application/json',
    'cache-control': 'no-cache',
    'x-ratelimit-limit': '1000',
    'x-ratelimit-remaining': '999'
  },
  body: {
    success: true,
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 3
    }
  }
};
