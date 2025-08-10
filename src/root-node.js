import collapseWhitespace from './collapse-whitespace'
import HTMLParser from './html-parser'
import { isBlock, isVoid, isTag } from './utilities'

export default function RootNode (input, options) {
  var root
  if (typeof input === 'string') {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + input + '</x-turndown>',
      'text/html'
    )
    root = doc.getElementById('turndown-root')
  } else {
    // For elements that need rule processing (like pre, blockquote, etc),
    // wrap them so they get processed correctly
    var clone = input.cloneNode(true)
    if (clone.nodeType === 1 && !isTag(clone, 'div') && !isTag(clone, 'body') && !isTag(clone, 'html')) {
      // Create wrapper element
      var wrapper = clone.ownerDocument.createElement('div')
      wrapper.appendChild(clone)
      root = wrapper
    } else {
      root = clone
    }
  }
  collapseWhitespace({
    element: root,
    isBlock: isBlock,
    isVoid: isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  })

  return root
}

var _htmlParser
function htmlParser () {
  _htmlParser = _htmlParser || new HTMLParser()
  return _htmlParser
}

function isPreOrCode (node) {
  return isTag(node, 'pre') || isTag(node, 'code')
}
