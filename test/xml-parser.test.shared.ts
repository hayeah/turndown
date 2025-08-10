import { describe, it, expect, beforeEach } from 'vitest'
import TurndownService from '../lib/turndown.es.js'

export interface DOMParserConstructor {
  new(): DOMParser;
}

export function createXmlParserTests(DOMParserImpl: DOMParserConstructor) {
  return () => {
    describe('XML and XHTML parsing', () => {
      let turndownService: TurndownService
      
      beforeEach(() => {
        turndownService = new TurndownService()
      })

      // Helper function to convert a single element by wrapping it
      const convertElement = (element: Element): string => {
        // Wrap the element in a div to ensure turndown processes it correctly
        const wrapper = element.ownerDocument.createElement('div')
        wrapper.appendChild(element.cloneNode(true))
        return turndownService.turndown(wrapper).trim()
      }

      // Helper function to parse HTML/XHTML and get elements
      const parseAndGetElement = <T extends Element = Element>(
        html: string,
        tagName: string,
        mimeType: 'text/html' | 'application/xhtml+xml' = 'text/html'
      ): T => {
        const parser = new DOMParserImpl()
        const doc = parser.parseFromString(html, mimeType)
        return doc.getElementsByTagName(tagName)[0] as T
      }

      // Helper function to parse XHTML with DOCTYPE and get body element
      const parseXHTMLAndGetBody = (bodyContent: string): HTMLBodyElement => {
        const xhtmlString = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" 
          "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
          <body>${bodyContent}</body>
        </html>`
        return parseAndGetElement<HTMLBodyElement>(xhtmlString, 'body', 'application/xhtml+xml')
      }

      // Helper function to test various forms of self-closing tags
      const testSelfClosingVariants = (
        tagName: string,
        attributes: string,
        expectedMarkdown: string
      ) => {
        const variants = [
          `<${tagName}${attributes}/>`,
          `<${tagName}${attributes} />`,
          `<${tagName}${attributes}>`
        ]
        
        variants.forEach(html => {
          const result = turndownService.turndown(html).trim()
          expect(result).toBe(expectedMarkdown)
        })
      }

      describe('self-closing tags', () => {
        it('should handle self-closing img tags', () => {
          const html = '<img src="test.jpg" alt="Test" />'
          const expected = '![Test](test.jpg)'
          const result = turndownService.turndown(html)
          expect(result).toBe(expected)
        })

        it('should handle self-closing br tags', () => {
          const html = 'Line 1<br />Line 2'
          const expected = 'Line 1  \nLine 2'
          const result = turndownService.turndown(html)
          expect(result).toBe(expected)
        })

        it('should handle self-closing hr tags', () => {
          const html = 'Text before<hr />Text after'
          const expected = 'Text before\n\n* * *\n\nText after'
          const result = turndownService.turndown(html)
          expect(result).toBe(expected)
        })

        it('should handle multiple self-closing tags', () => {
          const html = '<p>Paragraph with image <img src="test.jpg" alt="Test" /> and break<br />after.</p>'
          const expected = 'Paragraph with image ![Test](test.jpg) and break  \nafter.'
          const result = turndownService.turndown(html)
          expect(result).toBe(expected)
        })
      })

      describe('XML parsing', () => {
        it('should handle XML with self-closing tags', () => {
          const xmlString = '<?xml version="1.0"?><root><img src="test.jpg" alt="Test" /></root>'
          const parser = new DOMParserImpl()
          const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
          const imgElement = xmlDoc.getElementsByTagName('img')[0] as HTMLImageElement
          
          // Test that the element exists
          expect(imgElement).toBeDefined()
          expect(imgElement.getAttribute('src')).toBe('test.jpg')
          expect(imgElement.getAttribute('alt')).toBe('Test')
        })
      })

      describe('XHTML parsing', () => {
        it('should handle XHTML with self-closing tags', () => {
          const bodyContent = `
            <img src="test.jpg" alt="Test" />
            <br />
            <hr />
          `
          const body = parseXHTMLAndGetBody(bodyContent)
          const imgElement = body.getElementsByTagName('img')[0] as HTMLImageElement
          
          // Test that the element exists
          expect(imgElement).toBeDefined()
          expect(imgElement.getAttribute('src')).toBe('test.jpg')
          expect(imgElement.getAttribute('alt')).toBe('Test')
        })

        it('should convert XHTML DOM directly to markdown', () => {
          const body = parseXHTMLAndGetBody(
            '<p>Test with <img src="test.jpg" alt="Test" /> image</p>'
          )
          
          // Convert the XHTML DOM directly (not as string)
          const result = turndownService.turndown(body)
          const expected = 'Test with ![Test](test.jpg) image'
          expect(result).toBe(expected)
        })

        it('should convert XHTML document to markdown', () => {
          const bodyContent = `
            <h1>Title</h1>
            <p>Paragraph with <img src="test.jpg" alt="Test" /> image.</p>
            <hr />
            <p>Another paragraph<br />with line break.</p>
          `
          const body = parseXHTMLAndGetBody(bodyContent)
          
          const expectedMarkdown = `Title
=====

Paragraph with ![Test](test.jpg) image.

* * *

Another paragraph  
with line break.`
          
          // Convert using the body element to get just the content
          const result = turndownService.turndown(body)
          expect(result).toBe(expectedMarkdown)
        })
      })

      describe('Mixed content with self-closing tags', () => {
        it('should handle complex HTML with multiple self-closing elements', () => {
          const html = `
            <article>
              <h1>Article Title</h1>
              <img src="hero.jpg" alt="Hero Image" />
              <p>First paragraph with <img src="inline.jpg" alt="Inline" /> image.</p>
              <hr />
              <p>Second paragraph<br />with line break.</p>
              <img src="footer.jpg" alt="Footer Image" />
            </article>
          `
          
          const expectedMarkdown = `Article Title
=============

![Hero Image](hero.jpg)

First paragraph with ![Inline](inline.jpg) image.

* * *

Second paragraph  
with line break.

![Footer Image](footer.jpg)`
          
          const result = turndownService.turndown(html)
          expect(result).toBe(expectedMarkdown)
        })
      })

      describe('Edge cases', () => {
        it('should handle void elements with uppercase and lowercase nodeName', () => {
          // Test with regular HTML (uppercase nodeName)
          const htmlImg = parseAndGetElement<HTMLImageElement>(
            '<img src="test.jpg" />', 
            'img', 
            'text/html'
          )
          const htmlResult = convertElement(htmlImg)
          expect(htmlResult).toBe('![](test.jpg)')
          
          // Test with XHTML (lowercase nodeName)
          const xhtmlImg = parseAndGetElement<HTMLImageElement>(
            '<img src="test.jpg" xmlns="http://www.w3.org/1999/xhtml" />',
            'img',
            'application/xhtml+xml'
          )
          const xhtmlResult = convertElement(xhtmlImg)
          expect(xhtmlResult).toBe('![](test.jpg)')
        })

        it('should handle nested self-closing tags', () => {
          const html = `
            <div>
              <p>Text with <img src="1.jpg" alt="One" /> and <img src="2.jpg" alt="Two" /> images.</p>
              <p>More text<br />with<br />multiple<br />breaks.</p>
            </div>
          `
          const expected = `Text with ![One](1.jpg) and ![Two](2.jpg) images.

More text  
with  
multiple  
breaks.`
          
          const result = turndownService.turndown(html)
          expect(result).toBe(expected)
        })

        it('should handle malformed self-closing tags gracefully', () => {
          // Test img tags
          testSelfClosingVariants('img', ' src="test.jpg"', '![](test.jpg)')
          
          // Test br tags - they produce line breaks which get trimmed to empty string
          testSelfClosingVariants('br', '', '')
          
          // Test hr tags
          testSelfClosingVariants('hr', '', '* * *')
        })
      })
    })
  }
}