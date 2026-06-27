import type { Tool } from "@/lib/tool";
import { jsonFormatter } from "./json-formatter";
import { base64Tool } from "./base64";
import { jwtDecoder } from "./jwt-decoder";
import { timestampConverter } from "./timestamp";
import { regexTester } from "./regex-tester";
import { textDiff } from "./text-diff";
import { colorConverter } from "./color-converter";
import { hashGenerator } from "./hash-generator";
import { uuidGenerator } from "./uuid-generator";
import { urlEncoder } from "./url-encoder";
import { caseConverter } from "./case-converter";
import { slugGenerator } from "./slug-generator";
import { baseConverter } from "./base-converter";
import { htmlEntities } from "./html-entities";
import { loremIpsum } from "./lorem-ipsum";
import { jwtEncoder } from "./jwt-encoder";
import { cronParser } from "./cron-parser";
import { markdownPreview } from "./markdown-preview";
import { jsonYaml } from "./json-yaml";
import { xmlFormatter } from "./xml-formatter";
import { sqlFormatter } from "./sql-formatter";
import { wordCounter } from "./word-counter";
import { dateDiff } from "./date-diff";
import { passwordGenerator } from "./password-generator";
import { stringEscape } from "./string-escape";
import { httpStatus } from "./http-status";
import { timeZone } from "./timezone";
import { csvJson } from "./csv-json";
import { qrCode } from "./qr-code";
import { hashPassword } from "./hash-password";
import { curlFetch } from "./curl-fetch";

export const tools: Tool[] = [
  jsonFormatter,
  base64Tool,
  jwtDecoder,
  timestampConverter,
  regexTester,
  textDiff,
  colorConverter,
  hashGenerator,
  uuidGenerator,
  urlEncoder,
  caseConverter,
  slugGenerator,
  baseConverter,
  htmlEntities,
  loremIpsum,
  jwtEncoder,
  cronParser,
  markdownPreview,
  jsonYaml,
  xmlFormatter,
  sqlFormatter,
  wordCounter,
  dateDiff,
  passwordGenerator,
  stringEscape,
  httpStatus,
  timeZone,
  csvJson,
  qrCode,
  hashPassword,
  curlFetch,
];

export const toolsById: Record<string, Tool> = Object.fromEntries(
  tools.map((t) => [t.id, t]),
);

export type { Tool };
