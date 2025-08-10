import { describe } from 'vitest';
import { JSDOM } from 'jsdom';
import { createXHTMLParsingTests } from './xhtml-parsing.test.shared';

// Use jsdom's DOMParser
const { DOMParser } = new JSDOM().window;

describe('XHTML/XML Parsing - jsdom', createXHTMLParsingTests(DOMParser as any));