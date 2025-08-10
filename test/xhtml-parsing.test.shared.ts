import { beforeEach, it, expect, describe } from 'vitest';
import TurndownService from '../src/turndown';

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

    function parseXHTML(html: string): Document {
      return parser.parseFromString(html, 'application/xhtml+xml');
    }

    function parseXML(xml: string): Document {
      return parser.parseFromString(xml, 'text/xml');
    }

    function convertXHTML(html: string): string {
      const doc = parseXHTML(html);
      return turndownService.turndown(doc.body || doc.documentElement);
    }

    function convertXML(xml: string): string {
      const doc = parseXML(xml);
      return turndownService.turndown(doc.documentElement);
    }

    describe('XHTML/XML element name case sensitivity', () => {
      describe('inline code (lowercase <code>)', () => {
        it('should convert lowercase <code> to markdown backticks', () => {
          const input = '<p>Use <code>x &amp; y</code>.</p>';
          const expected = 'Use `x & y`.';
          expect(convertXHTML(input)).toBe(expected);
        });

        it('should handle mixed inline code with proper spacing', () => {
          const input = '<p>before<code>foo</code>after</p>';
          const expected = 'before`foo`after';
          expect(convertXHTML(input)).toBe(expected);
        });
      });

      describe('code blocks', () => {
        it('should convert pre/code to indented code block', () => {
          const input = '<pre><code>line1\n  line2</code></pre>';
          const expected = '    line1\n      line2';
          expect(convertXHTML(input)).toBe(expected);
        });

        it('should convert pre/code to fenced code block when configured', () => {
          turndownService.options.codeBlockStyle = 'fenced';
          const input = '<pre><code class="language-js">let x=1;</code></pre>';
          const expected = '```js\nlet x=1;\n```';
          expect(convertXHTML(input)).toBe(expected);
        });

        it('should handle pre with code when preformattedCode=false', () => {
          turndownService.options.preformattedCode = false;
          const input = '<pre><code>line 1\nline 2</code></pre>';
          const expected = '    line 1\n    line 2';
          expect(convertXHTML(input)).toBe(expected);
        });
      });

      describe('ordered lists (lowercase <ol>)', () => {
        it('should convert basic ordered list', () => {
          const input = '<ol><li>One</li><li>Two</li></ol>';
          const expected = '1.  One\n2.  Two';
          expect(convertXHTML(input)).toBe(expected);
        });

        it('should respect start attribute on ordered list', () => {
          const input = '<ol start="5"><li>Five</li><li>Six</li></ol>';
          const expected = '5.  Five\n6.  Six';
          expect(convertXHTML(input)).toBe(expected);
        });

        it('should handle nested code inside list item', () => {
          const input = '<ol><li>Use <code>x</code></li></ol>';
          const expected = '1.  Use `x`';
          expect(convertXHTML(input)).toBe(expected);
        });
      });

      describe('anchor links (lowercase <a>)', () => {
        it('should convert anchor with href and title', () => {
          const input = '<p><a href="/x" title="T">go</a></p>';
          const expected = '[go](/x "T")';
          expect(convertXHTML(input)).toBe(expected);
        });

        it('should convert anchor with just href', () => {
          const input = '<p><a href="https://example.com">link</a></p>';
          const expected = '[link](https://example.com)';
          expect(convertXHTML(input)).toBe(expected);
        });
      });

      describe('preformatted whitespace preservation', () => {
        it('should preserve whitespace in pre/code elements', () => {
          const input = '<pre><code>  a   b\n   c</code></pre>';
          const expected = '      a   b\n       c';
          expect(convertXHTML(input)).toBe(expected);
        });

        it('should preserve whitespace in pre/code combinations', () => {
          const input = '<pre><code>  indented\n    more</code></pre>';
          const expected = '      indented\n        more';
          expect(convertXHTML(input)).toBe(expected);
        });
      });
    });

    describe('XML/XHTML document structures', () => {
      it('should ignore XML prolog', () => {
        const input = '<?xml version="1.0" encoding="UTF-8"?><p>Hello</p>';
        const expected = 'Hello';
        expect(convertXML(input)).toBe(expected);
      });

      it('should handle XHTML document with namespace', () => {
        const input = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Test</title></head>
<body><p>Hi</p></body>
</html>`;
        const expected = 'Hi';
        const doc = parseXHTML(input);
        const result = turndownService.turndown(doc.body);
        expect(result).toBe(expected);
      });

      it('should handle XML document with custom namespace', () => {
        const input = '<?xml version="1.0"?><root xmlns="custom"><para>Text</para></root>';
        const doc = parseXML(input);
        const result = turndownService.turndown(doc.documentElement);
        expect(result).toBe('Text');
      });
    });

    describe('Complex XHTML scenarios', () => {
      it('should handle nested structures with mixed case elements', () => {
        const input = `<div>
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
          <ul>
            <li>Item with <code>code</code></li>
            <li>Item with <a href="/link">link</a></li>
          </ul>
        </div>`;
        const expected = `# Title

Paragraph with **bold** and _italic_.

*   Item with \`code\`
*   Item with [link](/link)`;
        expect(convertXHTML(input)).toBe(expected);
      });

      it('should handle blockquotes with nested elements', () => {
        const input = '<blockquote><p>Quote with <code>code</code> and <a href="/ref">reference</a>.</p></blockquote>';
        const expected = '> Quote with `code` and [reference](/ref).';
        expect(convertXHTML(input)).toBe(expected);
      });

      it('should handle definition lists (if supported)', () => {
        const input = '<dl><dt>Term</dt><dd>Definition</dd></dl>';
        const doc = parseXHTML(input);
        const result = turndownService.turndown(doc.documentElement);
        // Definition lists typically fallback to plain text
        expect(result).toContain('Term');
        expect(result).toContain('Definition');
      });
    });

    describe('Edge cases and special characters', () => {
      it('should handle HTML entities in XHTML', () => {
        const input = '<p>Less &lt; Greater &gt; Ampersand &amp;</p>';
        const expected = 'Less < Greater > Ampersand &';
        expect(convertXHTML(input)).toBe(expected);
      });

      it('should handle empty elements', () => {
        const input = '<p></p>';
        const expected = '';
        expect(convertXHTML(input)).toBe(expected);
      });

      it('should handle self-closing elements in XHTML', () => {
        const input = '<p>Line one<br/>Line two</p>';
        const expected = 'Line one  \nLine two';
        expect(convertXHTML(input)).toBe(expected);
      });

      it('should handle images with attributes', () => {
        const input = '<p><img src="/image.png" alt="Alt text" title="Title text"/></p>';
        const expected = '![Alt text](/image.png "Title text")';
        expect(convertXHTML(input)).toBe(expected);
      });

      it('should handle horizontal rules', () => {
        const input = '<div><p>Before</p><hr/><p>After</p></div>';
        const expected = 'Before\n\n* * *\n\nAfter';
        expect(convertXHTML(input)).toBe(expected);
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
        const doc = parseXHTML(input);
        const result = turndownService.turndown(doc.documentElement);
        // Tables typically require GFM plugin, so check fallback
        expect(result).toContain('Header 1');
        expect(result).toContain('Cell 1');
      });
    });

    describe('Mixed content and whitespace handling', () => {
      it('should handle mixed text and elements', () => {
        const input = 'Text before <code>code</code> text after';
        const doc = parseXHTML(`<p>${input}</p>`);
        const result = turndownService.turndown(doc.documentElement);
        expect(result).toBe('Text before `code` text after');
      });

      it('should collapse unnecessary whitespace', () => {
        const input = '<p>Multiple   spaces   between   words</p>';
        const expected = 'Multiple spaces between words';
        expect(convertXHTML(input)).toBe(expected);
      });

      it('should preserve necessary whitespace around inline elements', () => {
        const input = '<p>Word <strong>bold</strong> word <em>italic</em> word</p>';
        const expected = 'Word **bold** word _italic_ word';
        expect(convertXHTML(input)).toBe(expected);
      });
    });
  };
}