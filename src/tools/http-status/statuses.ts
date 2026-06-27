export interface HttpStatus {
  code: number;
  text: string;
  description: string;
}

export const STATUSES: HttpStatus[] = [
  { code: 100, text: "Continue",            description: "Server received the request headers; client should proceed." },
  { code: 101, text: "Switching Protocols", description: "Server is switching to the protocol specified in the Upgrade header." },
  { code: 102, text: "Processing",          description: "Server has received and is processing the request (WebDAV)." },
  { code: 103, text: "Early Hints",         description: "Used to return response headers before the final response." },
  { code: 200, text: "OK",                         description: "Request succeeded." },
  { code: 201, text: "Created",                    description: "Request succeeded and a new resource was created." },
  { code: 202, text: "Accepted",                   description: "Request received but not yet acted upon." },
  { code: 203, text: "Non-Authoritative Info",     description: "Returned metadata differs from the origin server." },
  { code: 204, text: "No Content",                 description: "No content to send; headers may be useful." },
  { code: 205, text: "Reset Content",              description: "Client should reset the document which sent this request." },
  { code: 206, text: "Partial Content",            description: "Partial content delivered per range header." },
  { code: 207, text: "Multi-Status",               description: "Multiple status codes for multiple operations (WebDAV)." },
  { code: 208, text: "Already Reported",           description: "Members already enumerated in a prior reply (WebDAV)." },
  { code: 226, text: "IM Used",                    description: "Response is a result of instance-manipulations (Delta encoding)." },
  { code: 300, text: "Multiple Choices",    description: "Multiple options for the resource; client should choose one." },
  { code: 301, text: "Moved Permanently",  description: "URL permanently changed. Use the new URL going forward." },
  { code: 302, text: "Found",              description: "Temporary redirect; client should use the new URL for this request." },
  { code: 303, text: "See Other",          description: "Redirect client to get the resource using GET." },
  { code: 304, text: "Not Modified",       description: "Resource not changed; client can use the cached version." },
  { code: 307, text: "Temporary Redirect", description: "Temporary redirect; method and body must not change." },
  { code: 308, text: "Permanent Redirect", description: "Permanent redirect; method and body must not change." },
  { code: 400, text: "Bad Request",                   description: "Server cannot process the request due to client error." },
  { code: 401, text: "Unauthorized",                  description: "Authentication is required and has failed or not been provided." },
  { code: 402, text: "Payment Required",              description: "Reserved for future use; sometimes used for rate limiting." },
  { code: 403, text: "Forbidden",                     description: "Client lacks permission to access the resource." },
  { code: 404, text: "Not Found",                     description: "Resource not found." },
  { code: 405, text: "Method Not Allowed",            description: "Request method is not supported for the resource." },
  { code: 406, text: "Not Acceptable",                description: "Response format not acceptable per Accept headers." },
  { code: 407, text: "Proxy Auth Required",           description: "Authentication with a proxy is required." },
  { code: 408, text: "Request Timeout",               description: "Server timed out waiting for the request." },
  { code: 409, text: "Conflict",                      description: "Request conflicts with current state of the resource." },
  { code: 410, text: "Gone",                          description: "Resource permanently deleted; no forwarding address." },
  { code: 411, text: "Length Required",               description: "Content-Length header required." },
  { code: 412, text: "Precondition Failed",           description: "One or more conditions in the request header failed." },
  { code: 413, text: "Content Too Large",             description: "Request body exceeds server limits." },
  { code: 414, text: "URI Too Long",                  description: "Request URI is longer than the server will process." },
  { code: 415, text: "Unsupported Media Type",        description: "Media format not supported." },
  { code: 416, text: "Range Not Satisfiable",         description: "Range specified in Range header cannot be fulfilled." },
  { code: 417, text: "Expectation Failed",            description: "Expect header requirement cannot be met." },
  { code: 418, text: "I'm a teapot",                  description: "Server refuses to brew coffee in a teapot (RFC 2324)." },
  { code: 421, text: "Misdirected Request",           description: "Request directed at a server unable to produce a response." },
  { code: 422, text: "Unprocessable Content",         description: "Well-formed but semantically incorrect request." },
  { code: 423, text: "Locked",                        description: "Resource is locked (WebDAV)." },
  { code: 424, text: "Failed Dependency",             description: "Request failed because a prior request failed (WebDAV)." },
  { code: 425, text: "Too Early",                     description: "Server unwilling to risk processing a replayed request." },
  { code: 426, text: "Upgrade Required",              description: "Client should switch to a different protocol." },
  { code: 428, text: "Precondition Required",         description: "Origin server requires conditional request." },
  { code: 429, text: "Too Many Requests",             description: "Client has sent too many requests in a given time." },
  { code: 431, text: "Request Header Fields Too Large", description: "Header fields are too large to be processed." },
  { code: 451, text: "Unavailable For Legal Reasons", description: "Resource unavailable due to a legal demand." },
  { code: 500, text: "Internal Server Error",    description: "Server encountered an unexpected condition." },
  { code: 501, text: "Not Implemented",          description: "Request method not supported by the server." },
  { code: 502, text: "Bad Gateway",              description: "Server acting as a gateway got an invalid response upstream." },
  { code: 503, text: "Service Unavailable",      description: "Server not ready to handle requests (overloaded or maintenance)." },
  { code: 504, text: "Gateway Timeout",          description: "Gateway did not get a timely response from an upstream server." },
  { code: 505, text: "HTTP Version Not Supported", description: "HTTP version in request is not supported." },
  { code: 506, text: "Variant Also Negotiates",  description: "Transparent content negotiation results in circular reference." },
  { code: 507, text: "Insufficient Storage",     description: "Server is unable to store the representation (WebDAV)." },
  { code: 508, text: "Loop Detected",            description: "Infinite loop detected while processing (WebDAV)." },
  { code: 510, text: "Not Extended",             description: "Further extensions required for the server to fulfill the request." },
  { code: 511, text: "Network Auth Required",    description: "Client needs to authenticate to gain network access." },
];

export function classOf(code: number): "1xx" | "2xx" | "3xx" | "4xx" | "5xx" {
  if (code < 200) return "1xx";
  if (code < 300) return "2xx";
  if (code < 400) return "3xx";
  if (code < 500) return "4xx";
  return "5xx";
}
