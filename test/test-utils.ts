import TurndownService from '../src/turndown';

export interface TestCase {
  description: string;
  input: string;
  expected: string;
  options?: any;
}

export function parseXHTML(html: string, DOMParserImpl: typeof DOMParser): Document {
  const parser = new DOMParserImpl();
  return parser.parseFromString(html, 'application/xhtml+xml');
}

export function parseXML(xml: string, DOMParserImpl: typeof DOMParser): Document {
  const parser = new DOMParserImpl();
  return parser.parseFromString(xml, 'text/xml');
}

export function convertXHTML(html: string, turndownService: any, DOMParserImpl: typeof DOMParser): string {
  const doc = parseXHTML(html, DOMParserImpl);
  return turndownService.turndown(doc.body || doc.documentElement);
}

export function convertXML(xml: string, turndownService: any, DOMParserImpl: typeof DOMParser): string {
  const doc = parseXML(xml, DOMParserImpl);
  return turndownService.turndown(doc.documentElement);
}

export function parseAndGetElement<T extends Element = Element>(
  html: string,
  tagName: string,
  mimeType: 'text/html' | 'application/xhtml+xml' = 'text/html',
  DOMParserImpl: typeof DOMParser
): T {
  const parser = new DOMParserImpl();
  const doc = parser.parseFromString(html, mimeType);
  return doc.getElementsByTagName(tagName)[0] as T;
}

export function parseXHTMLAndGetBody(bodyContent: string, DOMParserImpl: typeof DOMParser): HTMLBodyElement {
  const xhtmlString = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" 
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <body>${bodyContent}</body>
  </html>`;
  return parseAndGetElement<HTMLBodyElement>(xhtmlString, 'body', 'application/xhtml+xml', DOMParserImpl);
}

export function convertElement(element: Element, turndownService: any): string {
  // Wrap the element in a div to ensure turndown processes it correctly
  const wrapper = element.ownerDocument.createElement('div');
  wrapper.appendChild(element.cloneNode(true));
  return turndownService.turndown(wrapper).trim();
}