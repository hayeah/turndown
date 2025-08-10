import { describe } from 'vitest'
import { createXmlParserTests, type DOMParserConstructor } from './xml-parser.test.shared'

// Use the browser's native DOMParser
describe('XML Parser - browser', createXmlParserTests(window.DOMParser as DOMParserConstructor))