export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AuthType = 'none' | 'bearer' | 'api-key' | 'basic';

export interface HeaderEntry {
  key: string;
  value: string;
}

export interface QueryParam {
  key: string;
  value: string;
}

export interface ApiRequestConfig {
  url: string;
  method: HttpMethod;
  headers: HeaderEntry[];
  authType: AuthType;
  authToken: string;
  apiKeyHeader: string;
  apiKeyValue: string;
  basicUsername: string;
  basicPassword: string;
  queryParams: QueryParam[];
  body: string;
  bodyType: 'json' | 'form-data' | 'none';
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
}

export interface GeneratedFile {
  filename: string;
  content: string;
  language: string;
}

export interface TypeGenOptions {
  generateApiWrapper: boolean;
  generateRequestBody: boolean;
  generateZodSchema: boolean;
  generateApiService: boolean;
  rootName: string;
}

export const DEFAULT_REQUEST_CONFIG: ApiRequestConfig = {
  url: '',
  method: 'GET',
  headers: [],
  authType: 'none',
  authToken: '',
  apiKeyHeader: 'X-API-Key',
  apiKeyValue: '',
  basicUsername: '',
  basicPassword: '',
  queryParams: [],
  body: '',
  bodyType: 'json',
};

export const DEFAULT_TYPE_OPTIONS: TypeGenOptions = {
  generateApiWrapper: true,
  generateRequestBody: false,
  generateZodSchema: false,
  generateApiService: false,
  rootName: 'ApiResponse',
};
