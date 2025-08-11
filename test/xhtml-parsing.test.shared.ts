import { beforeEach, it, expect, describe } from 'vitest';
import TurndownService from '../src/turndown';
import { TestCase, parseXHTML, parseXML, convertXHTML, convertXML } from './test-utils';

export function createXHTMLParsingTests(DOMParserImpl: typeof DOMParser) {
  return () => {
    let turndownService: any;
    let parser: DOMParser;

    beforeEach(() => {
      turndownService = new TurndownService({
        headingStyle: 'atx'
      });
      parser = new DOMParserImpl();
    });

    function convert(html: string): string {
      return convertXHTML(html, turndownService, DOMParserImpl);
    }

    function convertXMLDoc(xml: string): string {
      return convertXML(xml, turndownService, DOMParserImpl);
    }

    describe('XHTML/XML element name case sensitivity', () => {
      describe('inline code (lowercase <code>)', () => {
        const testCases: TestCase[] = [
          {
            description: 'should convert lowercase <code> to markdown backticks',
            input: '<p>Use <code>x &amp; y</code>.</p>',
            expected: 'Use `x & y`.'
          },
          {
            description: 'should handle mixed inline code with proper spacing',
            input: '<p>before<code>foo</code>after</p>',
            expected: 'before`foo`after'
          }
        ];
        
        testCases.forEach(({ description, input, expected }) => {
          it(description, () => {
            expect(convert(input)).toBe(expected);
          });
        });
      });

      describe('code blocks', () => {
        const testCases: TestCase[] = [
          {
            description: 'should convert pre/code to indented code block',
            input: '<pre><code>line1\n  line2</code></pre>',
            expected: '    line1\n      line2'
          },
          {
            description: 'should convert pre/code to fenced code block when configured',
            input: '<pre><code class="language-js">let x=1;</code></pre>',
            expected: '```js\nlet x=1;\n```',
            options: { codeBlockStyle: 'fenced' }
          },
          {
            description: 'should handle pre with code when preformattedCode=false',
            input: '<pre><code>line 1\nline 2</code></pre>',
            expected: '    line 1\n    line 2',
            options: { preformattedCode: false }
          }
        ];
        
        testCases.forEach(({ description, input, expected, options }) => {
          it(description, () => {
            if (options) {
              Object.assign(turndownService.options, options);
            }
            expect(convert(input)).toBe(expected);
          });
        });
      });

      describe('ordered lists (lowercase <ol>)', () => {
        const testCases: TestCase[] = [
          {
            description: 'should convert basic ordered list',
            input: '<ol><li>One</li><li>Two</li></ol>',
            expected: '1.  One\n2.  Two'
          },
          {
            description: 'should respect start attribute on ordered list',
            input: '<ol start="5"><li>Five</li><li>Six</li></ol>',
            expected: '5.  Five\n6.  Six'
          },
          {
            description: 'should handle nested code inside list item',
            input: '<ol><li>Use <code>x</code></li></ol>',
            expected: '1.  Use `x`'
          }
        ];
        
        testCases.forEach(({ description, input, expected }) => {
          it(description, () => {
            expect(convert(input)).toBe(expected);
          });
        });
      });

      describe('anchor links (lowercase <a>)', () => {
        const testCases: TestCase[] = [
          {
            description: 'should convert anchor with href and title',
            input: '<p><a href="/x" title="T">go</a></p>',
            expected: '[go](/x "T")'
          },
          {
            description: 'should convert anchor with just href',
            input: '<p><a href="https://example.com">link</a></p>',
            expected: '[link](https://example.com)'
          }
        ];
        
        testCases.forEach(({ description, input, expected }) => {
          it(description, () => {
            expect(convert(input)).toBe(expected);
          });
        });
      });

      describe('preformatted whitespace preservation', () => {
        const testCases: TestCase[] = [
          {
            description: 'should preserve whitespace in pre/code elements',
            input: '<pre><code>  a   b\n   c</code></pre>',
            expected: '      a   b\n       c'
          },
          {
            description: 'should preserve whitespace in pre/code combinations',
            input: '<pre><code>  indented\n    more</code></pre>',
            expected: '      indented\n        more'
          }
        ];
        
        testCases.forEach(({ description, input, expected }) => {
          it(description, () => {
            expect(convert(input)).toBe(expected);
          });
        });
      });
    });

    describe('XML/XHTML document structures', () => {
      it('should ignore XML prolog', () => {
        const input = '<?xml version="1.0" encoding="UTF-8"?><p>Hello</p>';
        const expected = 'Hello';
        expect(convertXMLDoc(input)).toBe(expected);
      });

      it('should handle XHTML document with namespace', () => {
        const input = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Test</title></head>
<body><p>Hi</p></body>
</html>`;
        const expected = 'Hi';
        const doc = parseXHTML(input, DOMParserImpl);
        const result = turndownService.turndown(doc.body);
        expect(result).toBe(expected);
      });

      it('should handle XML document with custom namespace', () => {
        const input = '<?xml version="1.0"?><root xmlns="custom"><para>Text</para></root>';
        const doc = parseXML(input, DOMParserImpl);
        const result = turndownService.turndown(doc.documentElement);
        expect(result).toBe('Text');
      });
    });

    describe('Complex XHTML scenarios', () => {
      const testCases: TestCase[] = [
        {
          description: 'should handle nested structures with mixed case elements',
          input: `<div>
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
          <ul>
            <li>Item with <code>code</code></li>
            <li>Item with <a href="/link">link</a></li>
          </ul>
        </div>`,
          expected: `# Title

Paragraph with **bold** and _italic_.

*   Item with \`code\`
*   Item with [link](/link)`
        },
        {
          description: 'should handle blockquotes with nested elements',
          input: '<blockquote><p>Quote with <code>code</code> and <a href="/ref">reference</a>.</p></blockquote>',
          expected: '> Quote with `code` and [reference](/ref).'
        }
      ];
      
      testCases.forEach(({ description, input, expected }) => {
        it(description, () => {
          expect(convert(input)).toBe(expected);
        });
      });

      it('should handle definition lists (if supported)', () => {
        const input = '<dl><dt>Term</dt><dd>Definition</dd></dl>';
        const doc = parseXHTML(input, DOMParserImpl);
        const result = turndownService.turndown(doc.documentElement);
        // Definition lists typically fallback to plain text
        expect(result).toContain('Term');
        expect(result).toContain('Definition');
      });
    });

    describe('Edge cases and special characters', () => {
      const testCases: TestCase[] = [
        {
          description: 'should handle HTML entities in XHTML',
          input: '<p>Less &lt; Greater &gt; Ampersand &amp;</p>',
          expected: 'Less < Greater > Ampersand &'
        },
        {
          description: 'should handle empty elements',
          input: '<p></p>',
          expected: ''
        },
        {
          description: 'should handle self-closing elements in XHTML',
          input: '<p>Line one<br/>Line two</p>',
          expected: 'Line one  \nLine two'
        },
        {
          description: 'should handle multiple self-closing tags with content after',
          input: `<body>
        <custom-tag/>
        <title/>
        <a id="test"/>
        <h1>Content After Self-Closing Tags</h1>
        <br/>
        <p>More content</p>
      </body>`,
          expected: '# Content After Self-Closing Tags\n\n  \n\nMore content'
        },
        {
          description: 'should handle images with attributes',
          input: '<p><img src="/image.png" alt="Alt text" title="Title text"/></p>',
          expected: '![Alt text](/image.png "Title text")'
        },
        {
          description: 'should handle horizontal rules',
          input: '<div><p>Before</p><hr/><p>After</p></div>',
          expected: 'Before\n\n* * *\n\nAfter'
        }
      ];
      
      testCases.forEach(({ description, input, expected }) => {
        it(description, () => {
          expect(convert(input)).toBe(expected);
        });
      });
    });

    describe('Table handling in XHTML', () => {
      it('should convert simple table', () => {
        const input = `<table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </tbody>
        </table>`;
        const doc = parseXHTML(input, DOMParserImpl);
        const result = turndownService.turndown(doc.documentElement);
        // Tables typically require GFM plugin, so check fallback
        expect(result).toContain('Header 1');
        expect(result).toContain('Cell 1');
      });
    });

    describe('Mixed content and whitespace handling', () => {
      const testCases: TestCase[] = [
        {
          description: 'should collapse unnecessary whitespace',
          input: '<p>Multiple   spaces   between   words</p>',
          expected: 'Multiple spaces between words'
        },
        {
          description: 'should preserve necessary whitespace around inline elements',
          input: '<p>Word <strong>bold</strong> word <em>italic</em> word</p>',
          expected: 'Word **bold** word _italic_ word'
        }
      ];

      // Special handling for the first test case which needs custom parsing
      it('should handle mixed text and elements', () => {
        const input = 'Text before <code>code</code> text after';
        const doc = parseXHTML(`<p>${input}</p>`, DOMParserImpl);
        const result = turndownService.turndown(doc.documentElement);
        expect(result).toBe('Text before `code` text after');
      });

      // Run the rest as table tests
      testCases.forEach(({ description, input, expected }) => {
        it(description, () => {
          expect(convert(input)).toBe(expected);
        });
      });
    });
  };
}