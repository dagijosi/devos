import {
  FaCode, FaFileCode, FaFileAlt, FaMarkdown, FaYinYang,
  FaCube, FaFingerprint, FaTag, FaQrcode, FaKey, FaRandom, FaDatabase,
  FaLock, FaLockOpen, FaLink, FaUserSecret,
  FaGlobe, FaProjectDiagram, FaPlug,
  FaTable, FaFileExport, FaFileImport, FaEye,
  FaShieldAlt, FaHashtag, FaBug,
  FaNetworkWired, FaSearch, FaServer, FaMapPin,
  FaImage, FaCrop, FaPalette, FaVectorSquare,
  FaFont, FaCodeBranch, FaRuler, FaEraser,
  FaRegClock, FaPaintBrush, FaTachometerAlt, FaCog,
} from 'react-icons/fa';
import type { ToolDefinition } from './types';

const tools: ToolDefinition[] = [
  // ── Formatters ──
  { id: 'json-formatter', name: 'JSON Formatter', description: 'Format, validate and minify JSON', icon: FaCode, category: 'formatters', keywords: ['json', 'format', 'validate', 'pretty', 'minify'] },
  { id: 'sql-formatter', name: 'SQL Formatter', description: 'Format and beautify SQL queries', icon: FaDatabase, category: 'formatters', keywords: ['sql', 'format', 'beautify', 'query'] },
  { id: 'xml-formatter', name: 'XML Formatter', description: 'Format and validate XML', icon: FaFileCode, category: 'formatters', keywords: ['xml', 'format', 'pretty'] },
  { id: 'html-formatter', name: 'HTML Formatter', description: 'Format and beautify HTML', icon: FaCode, category: 'formatters', keywords: ['html', 'format', 'beautify'] },
  { id: 'yaml-formatter', name: 'YAML Formatter', description: 'Format and validate YAML', icon: FaFileAlt, category: 'formatters', keywords: ['yaml', 'yml', 'format'] },
  { id: 'markdown-preview', name: 'Markdown Preview', description: 'Live preview Markdown content', icon: FaMarkdown, category: 'formatters', keywords: ['markdown', 'md', 'preview', 'render'] },
  { id: 'minifier', name: 'Minifier', description: 'Minify JS, CSS, and JSON', icon: FaYinYang, category: 'formatters', keywords: ['minify', 'compress', 'uglify'] },

  // ── Generators ──
  { id: 'uuid-generator', name: 'UUID Generator', description: 'Generate UUID v4 identifiers', icon: FaCube, category: 'generators', keywords: ['uuid', 'guid', 'id', 'unique'] },
  { id: 'nanoid-generator', name: 'Nano ID Generator', description: 'Generate compact unique IDs', icon: FaFingerprint, category: 'generators', keywords: ['nanoid', 'nano', 'id', 'unique', 'short'] },
  { id: 'slug-generator', name: 'Slug Generator', description: 'Generate URL-friendly slugs', icon: FaTag, category: 'generators', keywords: ['slug', 'url', 'seo', 'text'] },
  { id: 'hash-generator', name: 'Hash Generator', description: 'Generate SHA hashes', icon: FaHashtag, category: 'generators', keywords: ['hash', 'sha', 'sha256', 'sha512', 'checksum'] },
  { id: 'qr-generator', name: 'QR Generator', description: 'Generate QR codes from text or URLs', icon: FaQrcode, category: 'generators', keywords: ['qr', 'qrcode', 'code', 'scan'] },
  { id: 'password-generator', name: 'Password Generator', description: 'Generate strong random passwords', icon: FaKey, category: 'generators', keywords: ['password', 'secure', 'random', 'crypto'] },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate placeholder text', icon: FaRandom, category: 'generators', keywords: ['lorem', 'ipsum', 'placeholder', 'text'] },
  { id: 'fake-data', name: 'Fake Data Generator', description: 'Generate mock user data', icon: FaDatabase, category: 'generators', keywords: ['fake', 'mock', 'data', 'test', 'seed'] },

  // ── Encoders ──
  { id: 'base64', name: 'Base64 Encode / Decode', description: 'Encode and decode Base64', icon: FaLock, category: 'encoders', keywords: ['base64', 'encode', 'decode', 'b64'] },
  { id: 'url-encode', name: 'URL Encode / Decode', description: 'Encode and decode URLs', icon: FaLink, category: 'encoders', keywords: ['url', 'encode', 'decode', 'percent'] },
  { id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode JWT tokens', icon: FaUserSecret, category: 'encoders', keywords: ['jwt', 'token', 'decode', 'auth'] },
  { id: 'unicode-encoder', name: 'Unicode Encoder', description: 'Encode and decode Unicode', icon: FaLockOpen, category: 'encoders', keywords: ['unicode', 'escape', 'encode', 'decode'] },

  // ── API ──
  { id: 'api-tester', name: 'REST Client', description: 'Send HTTP requests and view responses', icon: FaGlobe, category: 'api', keywords: ['api', 'rest', 'http', 'request', 'postman'] },
  { id: 'graphql-client', name: 'GraphQL Client', description: 'Query GraphQL APIs', icon: FaProjectDiagram, category: 'api', keywords: ['graphql', 'gql', 'query', 'api'] },
  { id: 'websocket-client', name: 'WebSocket Client', description: 'Test WebSocket connections', icon: FaPlug, category: 'api', keywords: ['websocket', 'ws', 'socket', 'realtime'] },

  // ── Database ──
  { id: 'sqlite-viewer', name: 'SQLite Viewer', description: 'View and explore SQLite databases', icon: FaTable, category: 'database', keywords: ['sqlite', 'db', 'database', 'viewer'] },
  { id: 'sql-runner', name: 'SQL Runner', description: 'Run SQL queries against your data', icon: FaDatabase, category: 'database', keywords: ['sql', 'query', 'run', 'execute'] },
  { id: 'json-to-sql', name: 'JSON to SQL', description: 'Convert JSON data to SQL inserts', icon: FaFileExport, category: 'database', keywords: ['json', 'sql', 'convert', 'import'] },
  { id: 'csv-viewer', name: 'CSV Viewer', description: 'View and analyze CSV files', icon: FaFileImport, category: 'database', keywords: ['csv', 'view', 'spreadsheet', 'data'] },
  { id: 'schema-viewer', name: 'Schema Viewer', description: 'Visualize database schemas', icon: FaEye, category: 'database', keywords: ['schema', 'db', 'structure', 'tables'] },

  // ── Security ──
  { id: 'sha256', name: 'SHA-256', description: 'Generate SHA-256 hash', icon: FaHashtag, category: 'security', keywords: ['sha256', 'sha-256', 'hash', 'security'] },
  { id: 'md5', name: 'MD5 Hash', description: 'Generate MD5 hash', icon: FaHashtag, category: 'security', keywords: ['md5', 'hash', 'checksum'] },
  { id: 'bcrypt', name: 'Bcrypt', description: 'Hash and verify passwords with bcrypt', icon: FaKey, category: 'security', keywords: ['bcrypt', 'password', 'hash', 'salt'] },
  { id: 'token-inspector', name: 'Token Inspector', description: 'Inspect OAuth tokens', icon: FaBug, category: 'security', keywords: ['token', 'oauth', 'jwt', 'bearer'] },
  { id: 'checksum', name: 'Checksum', description: 'Generate file checksums', icon: FaShieldAlt, category: 'security', keywords: ['checksum', 'sha', 'md5', 'file', 'verify'] },

  // ── Network ──
  { id: 'ping', name: 'Ping', description: 'Ping hosts and check connectivity', icon: FaNetworkWired, category: 'network', keywords: ['ping', 'network', 'host', 'latency'] },
  { id: 'dns-lookup', name: 'DNS Lookup', description: 'Look up DNS records', icon: FaSearch, category: 'network', keywords: ['dns', 'lookup', 'domain', 'ip'] },
  { id: 'port-checker', name: 'Port Checker', description: 'Check open ports', icon: FaServer, category: 'network', keywords: ['port', 'scan', 'network', 'tcp'] },
  { id: 'ip-lookup', name: 'IP Lookup', description: 'Look up IP address info', icon: FaMapPin, category: 'network', keywords: ['ip', 'geoip', 'location', 'whois'] },
  { id: 'url-inspector', name: 'URL Inspector', description: 'Parse and inspect URLs', icon: FaLink, category: 'network', keywords: ['url', 'parse', 'inspect', 'query'] },

  // ── Images ──
  { id: 'image-compressor', name: 'Image Compressor', description: 'Compress images without quality loss', icon: FaImage, category: 'images', keywords: ['image', 'compress', 'optimize', 'png', 'jpg'] },
  { id: 'resize-image', name: 'Resize Image', description: 'Resize images to exact dimensions', icon: FaCrop, category: 'images', keywords: ['resize', 'scale', 'image', 'dimensions'] },
  { id: 'color-picker', name: 'Color Picker', description: 'Pick and convert colors between formats', icon: FaPalette, category: 'images', keywords: ['color', 'picker', 'hex', 'rgb', 'hsl'] },
  { id: 'svg-preview', name: 'SVG Preview', description: 'Preview SVG code', icon: FaVectorSquare, category: 'images', keywords: ['svg', 'preview', 'vector', 'graphic'] },
  { id: 'base64-image', name: 'Base64 Image', description: 'Convert images to/from Base64', icon: FaImage, category: 'images', keywords: ['base64', 'image', 'encode', 'data-url'] },

  // ── Text ──
  { id: 'regex-tester', name: 'Regex Tester', description: 'Test regular expressions in real-time', icon: FaFont, category: 'text', keywords: ['regex', 'regular', 'expression', 'pattern'] },
  { id: 'diff-viewer', name: 'Diff Viewer', description: 'Compare text differences', icon: FaCodeBranch, category: 'text', keywords: ['diff', 'compare', 'patch', 'text'] },
  { id: 'word-counter', name: 'Word Counter', description: 'Count words, characters and lines', icon: FaRuler, category: 'text', keywords: ['word', 'counter', 'character', 'line', 'count'] },
  { id: 'case-converter', name: 'Case Converter', description: 'Convert between text cases', icon: FaFont, category: 'text', keywords: ['case', 'upper', 'lower', 'camel', 'snake'] },
  { id: 'find-replace', name: 'Find & Replace', description: 'Search and replace text', icon: FaEraser, category: 'text', keywords: ['find', 'replace', 'search', 'text'] },

  // ── Developer ──
  { id: 'timestamp-converter', name: 'Timestamp Converter', description: 'Convert Unix timestamps to dates', icon: FaRegClock, category: 'developer', keywords: ['timestamp', 'unix', 'epoch', 'date', 'time'] },
  { id: 'cron-parser', name: 'Cron Parser', description: 'Parse and explain cron expressions', icon: FaTachometerAlt, category: 'developer', keywords: ['cron', 'schedule', 'parse', 'cronjob'] },
  { id: 'gradient-builder', name: 'Gradient Builder', description: 'Create CSS gradients visually', icon: FaPaintBrush, category: 'developer', keywords: ['gradient', 'css', 'color', 'design'] },
  { id: 'env-viewer', name: 'Env Viewer', description: 'Manage environment variables', icon: FaCog, category: 'developer', keywords: ['env', 'environment', 'variables', 'config'] },
];

export default tools;
