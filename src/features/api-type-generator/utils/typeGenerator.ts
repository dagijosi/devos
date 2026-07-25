export interface TypeGenResult {
  interfaces: string[];
  zodSchemas: string[];
  apiService: string;
}

interface AnalyzedField {
  name: string;
  type: string;
  optional: boolean;
  nullable: boolean;
  children?: AnalyzedField[];
}

function jsonType(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'number') return Number.isInteger(val) ? 'number' : 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'object') return 'object';
  return 'unknown';
}

function inferArrayType(arr: unknown[]): string {
  const elementTypes = new Set(arr.map(v => jsonType(v)));
  const nonNull = arr.filter(v => v !== null && v !== undefined);

  if (nonNull.length === 0) return 'unknown';

  if (elementTypes.size === 1) {
    const only = [...elementTypes][0];
    if (only === 'object') return inferObjectTypeName(nonNull[0], 'Item');
    if (only === 'array') return 'unknown[][]';
    return only;
  }

  const allObjs = nonNull.every(v => typeof v === 'object' && !Array.isArray(v));
  if (allObjs) return inferObjectTypeName(nonNull[0], 'Item');

  return 'unknown';
}

function inferObjectTypeName(obj: unknown, fallback: string): string {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    const keys = Object.keys(obj as Record<string, unknown>);
    const name = keys.length > 0 ? keys.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join('') : fallback;
    return name;
  }
  return fallback;
}

function capitalize(name: string): string {
  return name.replace(/[_-]([a-z])/g, (_, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase());
}

interface CollectedType {
  name: string;
  fields: AnalyzedField[];
}

function collectTypes(obj: Record<string, unknown>, parentName: string, collected: CollectedType[]): void {
  const fields: AnalyzedField[] = [];
  const allKeys = new Set<string>(Object.keys(obj));

  for (const key of allKeys) {
    const val = obj[key];
    const isOptional = !(key in obj) || val === undefined;
    const isNullable = val === null;

    let tsType: string;
    let childType: CollectedType | null = null;

    if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
      const childName = capitalize(key);
      tsType = childName;
      childType = { name: childName, fields: [] };
      collectTypes(val as Record<string, unknown>, childName, collected);
    } else if (Array.isArray(val)) {
      if (val.length > 0) {
        const firstEl = val.find(v => v !== null && v !== undefined);
        if (firstEl && typeof firstEl === 'object' && !Array.isArray(firstEl)) {
          const childName = `${capitalize(key)}Item`;
          tsType = `${childName}[]`;
          childType = { name: childName, fields: [] };
          collectTypes(firstEl as Record<string, unknown>, childName, collected);
        } else {
          tsType = `${inferArrayType(val)}[]`;
        }
      } else {
        tsType = 'unknown[]';
      }
    } else {
      tsType = jsonType(val);
    }

    fields.push({ name: key, type: tsType, optional: isOptional, nullable: isNullable });
    if (childType) collected.push(childType);
  }

  const existing = collected.find(c => c.name === parentName);
  if (existing) {
    existing.fields = fields;
  } else {
    collected.push({ name: parentName, fields });
  }
}

function renderInterface(name: string, _fields: AnalyzedField[], visited: Set<string>, allCollected: CollectedType[]): string {
  if (visited.has(name)) return '';
  visited.add(name);

  const type = allCollected.find(c => c.name === name);
  if (!type) return '';

  const childInterfaces = type.fields
    .filter(f => f.children || allCollected.some(c => c.name === f.type.replace('[]', '')))
    .map(f => {
      const childName = f.type.replace('[]', '');
      if (childName === name || visited.has(childName)) return '';
      return renderInterface(childName, allCollected.find(c => c.name === childName)?.fields ?? [], visited, allCollected);
    })
    .filter(Boolean)
    .join('\n\n');

  const fieldLines = type.fields.map(f => {
    let typeStr = f.type;
    if (f.nullable && !typeStr.includes('null')) typeStr = `${typeStr} | null`;
    const opt = f.optional ? '?' : '';
    return `  ${f.name}${opt}: ${typeStr};`;
  });

  const iface = `export interface ${name} {\n${fieldLines.join('\n')}\n}`;

  return childInterfaces ? `${childInterfaces}\n\n${iface}` : iface;
}

function guessResponseName(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Payload';
  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 1 && Array.isArray(obj[keys[0]])) {
    return capitalize(keys[0]);
  }
  return 'SuccessResponse';
}

export function generateTypes(
  successData: unknown,
  errorData: unknown,
  rootName: string,
  options: {
    generateApiWrapper: boolean;
    generateRequestBody: boolean;
    generateZodSchema: boolean;
    generateApiService: boolean;
    rootName: string;
  }
): TypeGenResult {
  const collected: CollectedType[] = [];
  const visited = new Set<string>();

  const responseTypeName = guessResponseName(successData);
  const errorTypeName = 'ErrorResponse';

  if (successData && typeof successData === 'object' && !Array.isArray(successData)) {
    collectTypes(successData as Record<string, unknown>, responseTypeName, collected);
  }
  if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
    collectTypes(errorData as Record<string, unknown>, errorTypeName, collected);
  }

  const interfaces: string[] = [];
  const zodSchemas: string[] = [];

  const shouldWrap = options.generateApiWrapper
    && successData && typeof successData === 'object'
    && !Array.isArray(successData)
    && 'success' in (successData as Record<string, unknown>)
    && 'message' in (successData as Record<string, unknown>);

  if (shouldWrap) {
    interfaces.push(
      `export interface ${rootName}<T> {\n  success: boolean;\n  message: string;\n  data: T;\n}`
    );
  }

  const successIface = renderInterface(responseTypeName, [], visited, collected);
  const errorIface = renderInterface(errorTypeName, [], visited, collected);

  if (successIface) interfaces.push(successIface);
  if (errorIface) interfaces.push(errorIface);

  if (successData && !successIface) {
    const directType = typeof successData === 'string' ? 'string'
      : typeof successData === 'number' ? 'number'
      : typeof successData === 'boolean' ? 'boolean'
      : 'unknown';
    interfaces.push(`export type ${responseTypeName} = ${directType};`);
  }
  if (errorData && !errorIface) {
    const directType = typeof errorData === 'string' ? 'string'
      : typeof errorData === 'number' ? 'number'
      : typeof errorData === 'boolean' ? 'boolean'
      : 'unknown';
    interfaces.push(`export type ${errorTypeName} = ${directType};`);
  }

  if (shouldWrap) {
    interfaces.push(`\nexport type ApiSuccessResponse = ${rootName}<${responseTypeName}>;`);
    interfaces.push(`export type ApiErrorResponse = ${rootName}<${errorTypeName}>;`);
  }

  if (options.generateZodSchema && collected.length > 0) {
    for (const type of collected) {
      const props = type.fields.map(f => {
        const zodType = mapToZodType(f.type);
        return `  ${f.name}: ${zodType}${f.nullable ? '.nullable()' : ''}${f.optional ? '.optional()' : ''},`;
      });
      zodSchemas.push(`const ${type.name}Schema = z.object({\n${props.join('\n')}\n});`);
      zodSchemas.push(`export type ${type.name}Type = z.infer<typeof ${type.name}Schema>;`);
    }
  }

  const apiService = options.generateApiService && successData
    ? generateApiService(responseTypeName, rootName)
    : '';

  return { interfaces, zodSchemas, apiService };
}

function mapToZodType(tsType: string): string {
  if (tsType === 'string') return 'z.string()';
  if (tsType === 'number') return 'z.number()';
  if (tsType === 'boolean') return 'z.boolean()';
  if (tsType.endsWith('[]')) return `z.array(${mapToZodType(tsType.slice(0, -2))})`;
  if (tsType === 'unknown' || tsType.includes('Item')) return 'z.unknown()';
  if (tsType === 'null') return 'z.null()';
  return 'z.unknown()';
}

function generateApiService(responseType: string, rootName: string): string {
  return `import { ${rootName}, ${responseType} } from './api.types';\n\nexport async function fetchData(endpoint: string): Promise<${rootName}<${responseType}>> {\n  const res = await fetch(endpoint);\n  return res.json();\n}`;
}
