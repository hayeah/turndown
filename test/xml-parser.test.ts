import { describe } from 'vitest'
import { JSDOM } from 'jsdom'
import { createXmlParserTests, type DOMParserConstructor } from './xml-parser.test.shared'

// Use jsdom's DOMParser
const { DOMParser } = new JSDOM().window

describe('XML Parser - jsdom', createXmlParserTests(DOMParser as unknown as DOMParserConstructor))