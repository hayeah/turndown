import { describe } from 'vitest';
import { createXHTMLParsingTests } from './xhtml-parsing.test.shared';

describe('XHTML/XML Parsing - browser', createXHTMLParsingTests(DOMParser));