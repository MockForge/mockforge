export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type MockAPIMetadata = {
  // Name of the API
  name: string;
  // Description of the API
  description: string;
};

export interface HttpMockAPI {
  // Type of mock
  type: 'http';
  // Pathname of the API
  pathname: string;
  // HTTP method
  method: HttpMethod;

  // Name of the API
  name: string;
  // Description of the API
  description?: string;

  // Various types of responses
  mockResponses: HttpMockResponse[];
}

export type MockAPI = HttpMockAPI;

export interface HttpMockResponse {
  // Name of the mock response
  name: string;

  $schema: string;

  // Schema version identifier
  schema: 'http_response_v1';

  // Description of the mock response
  description?: string;

  // Request matching rules
  requestMatcher: {
    type: 'basic-match';
    // Content corresponding to the type
    content: {
      body?: unknown;
      params?: Record<string, string>;
      headers?: Record<string, string>;
      query?: Record<string, string>;
    };
  } | null;
  // Specific content of the mock response
  responseData: {
    type: 'json';
    content: unknown;
  };
}

export type AddHttpMockResponse = Omit<HttpMockResponse, '$schema'>;
export type UpdateHttpMockResponseSchema = Pick<
  HttpMockResponse,
  'name' | 'description' | 'requestMatcher' | 'responseData'
>;

export type UpdateHttpMockAPISchema = Pick<HttpMockAPI, 'method' | 'description'>;
