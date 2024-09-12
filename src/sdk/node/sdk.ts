import fs from 'fs/promises';
import path from 'path';
import { checkDirAndFileName, decodeHttpApiPath, encodeHttpApiPath, METADATA_FILENAME } from '../common/filename.js';
import { IMockForgeSDK } from '../common/sdk.js';
import {
  AddHttpMockResponse,
  HttpMockResponse,
  MockAPI,
  MockAPIMetadata,
  UpdateHttpMockResponseSchema,
} from '../common/types.js';

export class MockForgeSDK implements IMockForgeSDK {
  constructor(private baseDir: string) {}

  async listMockAPIs(): Promise<MockAPI[]> {
    const httpDir = path.join(this.baseDir, 'http');
    if (!(await this.exist(httpDir))) {
      return [];
    }
    const files = await fs.readdir(httpDir);
    const httpAPI = await Promise.all(
      files.map(async (file): Promise<MockAPI | null> => {
        try {
          const metaDataPath = path.join(httpDir, file, METADATA_FILENAME);
          const metaDateContent = await fs.readFile(metaDataPath, 'utf-8');
          const metaData: MockAPIMetadata = JSON.parse(metaDateContent);
          const [method, pathname] = decodeHttpApiPath(file);
          const mockResponseFiles = await fs.readdir(path.join(httpDir, file));
          const mockResponses = await Promise.all(
            mockResponseFiles.map(async (mockResponseFile) => {
              const mockResponsePath = path.join(httpDir, file, mockResponseFile);
              const mockResponseContent = await fs.readFile(mockResponsePath, 'utf-8');
              const mockData = JSON.parse(mockResponseContent);
              if (mockData.schema !== 'http_response_v1') {
                return null;
              }
              mockData.name = mockResponseFile.replace('.json', '');
              return mockData;
            })
          );
          return {
            method,
            pathname,
            type: 'http',
            name: metaData.name,
            mockResponses: mockResponses.filter((o) => !!o),
            description: metaData.description,
          };
        } catch (error) {
          return null;
        }
      })
    );
    return httpAPI.filter((o) => !!o);
  }

  async addMockAPI(mockAPI: MockAPI): Promise<void> {
    const metaDataPath = this.resolveAPIMetadata(mockAPI);
    if (await this.exist(metaDataPath)) {
      throw new Error('API already exists');
    }
    for (const mockResponse of mockAPI.mockResponses) {
      const mockResponsePath = this.resolveMockResponsePath(mockAPI.method, mockAPI.pathname, mockResponse.name);
      if (await this.exist(mockResponsePath)) {
        throw new Error(`Mock response ${mockResponse.name} already exists`);
      }
    }
    await fs.mkdir(path.dirname(metaDataPath), { recursive: true });
    await fs.writeFile(
      metaDataPath,
      JSON.stringify(
        {
          name: mockAPI.name,
          description: mockAPI.description,
        },
        null,
        2
      )
    );
    for (const mockResponse of mockAPI.mockResponses) {
      await this.addHttpMockResponse(mockAPI.method, mockAPI.pathname, mockResponse);
    }
  }

  async updateHttpMockAPI(method: string, pathname: string, data: MockAPIMetadata) {
    const metaDataPath = path.join(this.resolveHttpApiDir(method, pathname), METADATA_FILENAME);
    const mockAPI = JSON.parse(await fs.readFile(metaDataPath, 'utf-8'));
    fs.writeFile(metaDataPath, JSON.stringify({ ...mockAPI, ...data }, null, 2));
  }

  async addHttpMockResponse(
    method: string,
    pathname: string,
    mockResponse: AddHttpMockResponse
  ): Promise<HttpMockResponse> {
    const mockResponsePath = this.resolveMockResponsePath(method, pathname, mockResponse.name);
    if (await this.exist(mockResponsePath)) {
      throw new Error(`Mock response ${mockResponse.name} already exists`);
    }
    const httpMockResponseToWrite: Partial<HttpMockResponse> = {
      ...mockResponse,
      $schema: 'https://unpkg.com/mockforge@0.2.0/json-schema/http_response_v1.json',
    };
    delete httpMockResponseToWrite.name;
    await fs.writeFile(mockResponsePath, JSON.stringify(httpMockResponseToWrite, null, 2));
    return {
      ...mockResponse,
      $schema: 'https://unpkg.com/mockforge@0.2.0/json-schema/http_response_v1.json',
    };
  }

  async updateHttpMockResponse(
    method: string,
    pathname: string,
    mockResponse: UpdateHttpMockResponseSchema
  ): Promise<HttpMockResponse> {
    const mockResponsePath = this.resolveMockResponsePath(method, pathname, mockResponse.name);
    if (!(await this.exist(mockResponsePath))) {
      throw new Error(`Mock response ${mockResponse.name} not exists`);
    }
    const httpMockResponseToWrite: Partial<HttpMockResponse> = {
      ...mockResponse,
      $schema: 'https://unpkg.com/mockforge@0.2.0/json-schema/http_response_v1.json',
    };
    delete httpMockResponseToWrite.name;
    await fs.writeFile(mockResponsePath, JSON.stringify(httpMockResponseToWrite, null, 2));
    return {
      ...mockResponse,
      $schema: 'https://unpkg.com/mockforge@0.2.0/json-schema/http_response_v1.json',
    };
  }

  deleteHttpMockResponse(method: string, pathname: string, mockResponseName: string): Promise<void> {
    const mockResponsePath = this.resolveMockResponsePath(method, pathname, mockResponseName);
    return fs.unlink(mockResponsePath);
  }

  async deleteHttpMockAPI(method: string, pathname: string): Promise<void> {
    const metaDataPath = this.resolveHttpApiDir(method, pathname);
    await fs.rm(metaDataPath, { recursive: true });
  }

  private resolveMockResponsePath(method: string, pathname: string, mockResponseName: string) {
    const apiDir = this.resolveHttpApiDir(method, pathname);
    const mockJSONName = `${mockResponseName}.json`;
    if (!checkDirAndFileName(mockJSONName)) {
      throw new Error(`Invalid mockJSONName : ${mockJSONName}`);
    }
    return path.join(apiDir, mockJSONName);
  }

  private async exist(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      } else {
        throw error;
      }
    }
  }

  private resolveAPIMetadata(mockAPI: MockAPI) {
    switch (mockAPI.type) {
      case 'http': {
        const apiDir = path.join(this.resolveHttpApiDir(mockAPI.method, mockAPI.pathname), METADATA_FILENAME);
        return apiDir;
      }
      default: {
        throw new Error('Unsupported mock type');
      }
    }
  }

  private resolveHttpApiDir(method: string, pathname: string) {
    const dirname = encodeHttpApiPath(method, pathname);
    if (!checkDirAndFileName(dirname)) {
      throw new Error('Invalid path');
    }
    return path.join(this.baseDir, 'http', dirname);
  }
}
