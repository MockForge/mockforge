import { originalFetchRequest } from './originalFetchRequest.ts';
import { ISimulatedRequestHandler } from './RequestSimulator';

import fetchMock from 'fetch-mock';

fetchMock.config.fallbackToNetwork = true;
export function patchFetch(mock: ISimulatedRequestHandler) {
  console.log('patchFetch');
  return fetchMock.mock('*', (url, opts) => {
    const method = opts?.method ?? 'GET';
    const body = opts?.body;
    const headers = convertHeadersInitToRecord(opts?.headers);
    console.log('handleSimulatedRequest', {
      url: url,
      method,
      body,
      headers: headers,
    });
    const mockRes = mock.handleSimulatedRequest({
      url: url,
      method,
      body,
      headers: headers,
    });
    if (!mockRes) {
      return originalFetchRequest(url, opts);
    }

    return {
      status: mockRes.status,
      body: mockRes.body,
    };
  });
}

function convertHeadersInitToRecord(headers: HeadersInit | undefined): Record<string, string> | undefined {
  if (!headers) {
    return undefined;
  }
  if (headers instanceof Headers) {
    let result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } else if (Array.isArray(headers)) {
    let result: Record<string, string> = {};
    headers.forEach(([key, value]) => {
      result[key] = value;
    });
    return result;
  } else if (typeof headers === 'object') {
    return headers as Record<string, string>;
  }

  console.error('Invalid headers type');
  return undefined;
}
