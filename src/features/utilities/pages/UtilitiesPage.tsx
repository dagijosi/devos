import { useMemo, type ComponentType } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { UtilitiesSidebar } from '../components/UtilitiesSidebar';
import { ToolGrid } from '../components/ToolGrid';
import { ToolShell } from '../components/ToolShell';
import { useUtilitiesStore } from '../store/utilities.store';
import allTools from '../toolDefinitions';

import { JsonFormatter } from '../components/tools/JsonFormatter';
import { SqlFormatter } from '../components/tools/SqlFormatter';
import { Base64Tool } from '../components/tools/Base64Tool';
import { ColorPicker } from '../components/tools/ColorPicker';
import { HashGenerator } from '../components/tools/HashGenerator';
import { ImageCompressor } from '../components/tools/ImageCompressor';
import { JwtDecoder } from '../components/tools/JwtDecoder';
import { PasswordGenerator } from '../components/tools/PasswordGenerator';
import { QrGenerator } from '../components/tools/QrGenerator';
import { RegexTester } from '../components/tools/RegexTester';
import { TimestampConverter } from '../components/tools/TimestampConverter';
import { UuidGenerator } from '../components/tools/UuidGenerator';
import { ApiTester } from '../components/tools/ApiTester';
import { XmlFormatter } from '../components/tools/XmlFormatter';
import { HtmlFormatter } from '../components/tools/HtmlFormatter';
import { YamlFormatter } from '../components/tools/YamlFormatter';
import { MarkdownPreview } from '../components/tools/MarkdownPreview';
import { Minifier } from '../components/tools/Minifier';
import { NanoIdGenerator } from '../components/tools/NanoIdGenerator';
import { SlugGenerator } from '../components/tools/SlugGenerator';
import { LoremIpsum } from '../components/tools/LoremIpsum';
import { FakeDataGenerator } from '../components/tools/FakeDataGenerator';
import { UrlEncoder } from '../components/tools/UrlEncoder';
import { UnicodeEncoder } from '../components/tools/UnicodeEncoder';
import { GraphqlClient } from '../components/tools/GraphqlClient';
import { WebsocketClient } from '../components/tools/WebsocketClient';
import { SqliteViewer } from '../components/tools/SqliteViewer';
import { SqlRunner } from '../components/tools/SqlRunner';
import { JsonToSql } from '../components/tools/JsonToSql';
import { CsvViewer } from '../components/tools/CsvViewer';
import { SchemaViewer } from '../components/tools/SchemaViewer';
import { Sha256Tool } from '../components/tools/Sha256Tool';
import { Md5Tool } from '../components/tools/Md5Tool';
import { BcryptTool } from '../components/tools/BcryptTool';
import { TokenInspector } from '../components/tools/TokenInspector';
import { ChecksumTool } from '../components/tools/ChecksumTool';
import { PingTool } from '../components/tools/PingTool';
import { DnsLookup } from '../components/tools/DnsLookup';
import { PortChecker } from '../components/tools/PortChecker';
import { IpLookup } from '../components/tools/IpLookup';
import { UrlInspector } from '../components/tools/UrlInspector';
import { ResizeImage } from '../components/tools/ResizeImage';
import { SvgPreview } from '../components/tools/SvgPreview';
import { Base64ImageTool } from '../components/tools/Base64Image';
import { DiffViewer } from '../components/tools/DiffViewer';
import { WordCounter } from '../components/tools/WordCounter';
import { CaseConverter } from '../components/tools/CaseConverter';
import { FindReplace } from '../components/tools/FindReplace';
import { CronParser } from '../components/tools/CronParser';
import { GradientBuilder } from '../components/tools/GradientBuilder';
import { EnvViewer } from '../components/tools/EnvViewer';

const Placeholder = () => (
  <div className="flex flex-col items-center justify-center py-12 text-theme-text/30">
    <FaExclamationTriangle className="w-8 h-8 mb-2" />
    <p className="text-xs">Tool not found</p>
  </div>
);

const toolComponentMap: Record<string, ComponentType> = {
  'json-formatter': JsonFormatter,
  'sql-formatter': SqlFormatter,
  'xml-formatter': XmlFormatter,
  'html-formatter': HtmlFormatter,
  'yaml-formatter': YamlFormatter,
  'markdown-preview': MarkdownPreview,
  'minifier': Minifier,
  'uuid-generator': UuidGenerator,
  'nanoid-generator': NanoIdGenerator,
  'slug-generator': SlugGenerator,
  'hash-generator': HashGenerator,
  'qr-generator': QrGenerator,
  'password-generator': PasswordGenerator,
  'lorem-ipsum': LoremIpsum,
  'fake-data': FakeDataGenerator,
  'base64': Base64Tool,
  'url-encode': UrlEncoder,
  'jwt-decoder': JwtDecoder,
  'unicode-encoder': UnicodeEncoder,
  'api-tester': ApiTester,
  'graphql-client': GraphqlClient,
  'websocket-client': WebsocketClient,
  'sqlite-viewer': SqliteViewer,
  'sql-runner': SqlRunner,
  'json-to-sql': JsonToSql,
  'csv-viewer': CsvViewer,
  'schema-viewer': SchemaViewer,
  'sha256': Sha256Tool,
  'md5': Md5Tool,
  'bcrypt': BcryptTool,
  'token-inspector': TokenInspector,
  'checksum': ChecksumTool,
  'ping': PingTool,
  'dns-lookup': DnsLookup,
  'port-checker': PortChecker,
  'ip-lookup': IpLookup,
  'url-inspector': UrlInspector,
  'image-compressor': ImageCompressor,
  'resize-image': ResizeImage,
  'color-picker': ColorPicker,
  'svg-preview': SvgPreview,
  'base64-image': Base64ImageTool,
  'regex-tester': RegexTester,
  'diff-viewer': DiffViewer,
  'word-counter': WordCounter,
  'case-converter': CaseConverter,
  'find-replace': FindReplace,
  'timestamp-converter': TimestampConverter,
  'cron-parser': CronParser,
  'gradient-builder': GradientBuilder,
  'env-viewer': EnvViewer,
};

export function UtilitiesPage() {
  const { activeTool, searchQuery, activeCategory, showFavoritesOnly, favoriteTools, recentTools } = useUtilitiesStore();

  const matchedTool = useMemo(() => {
    if (!activeTool) return null;
    return allTools.find((t) => t.id === activeTool) ?? null;
  }, [activeTool]);

  const visibleTools = useMemo(() => {
    let list = [...allTools];
    if (showFavoritesOnly) list = list.filter((t) => favoriteTools.includes(t.id));
    if (activeCategory) list = list.filter((t) => t.category === activeCategory);
    if (searchQuery && searchQuery !== 'recent:') {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q))
      );
    }
    if (searchQuery === 'recent:') {
      const recentSet = new Set(recentTools);
      list = list.filter((t) => recentSet.has(t.id));
      list.sort((a, b) => recentTools.indexOf(a.id) - recentTools.indexOf(b.id));
    }
    return list;
  }, [searchQuery, activeCategory, showFavoritesOnly, favoriteTools, recentTools]);

  if (matchedTool) {
    const Icon = matchedTool.icon;
    const ToolComponent = toolComponentMap[matchedTool.id] || Placeholder;
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ToolShell
          toolId={matchedTool.id}
          name={matchedTool.name}
          description={matchedTool.description}
          icon={<Icon className="w-5 h-5 text-theme-icon" />}
        >
          <ToolComponent />
        </ToolShell>
      </div>
    );
  }

  return (
    <div className="p-6 flex gap-6 h-full">
      <UtilitiesSidebar />
      <div className="flex-1 min-w-0">
        <ToolGrid tools={visibleTools} favorites={favoriteTools} recent={recentTools} />
      </div>
    </div>
  );
}
