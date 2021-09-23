import Quill from 'quill';
import * as Parchment from 'parchment';
const EmbedBlot = Quill.import('blots/embed') as typeof Parchment.default.Embed;
import { sanitize } from 'quill/formats/link';

const ATTRIBUTES = [
  'alt',
  'height',
  'width'
];

class Media extends EmbedBlot {
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      (node as Element).setAttribute('src', this.sanitize(value));
    }
    return node;
  }

  static formats(domNode) {
    return ATTRIBUTES.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }

  static match(url) {
    return /\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url);
  }

  static sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
  }

  static value(domNode) {
    return domNode.getAttribute('src');
  }

  format(name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        (this.domNode as Element).setAttribute(name, value);
      } else {
        (this.domNode as Element).removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}
Media.blotName = 'media';
Media.tagName = 'IMG';

export default Media;
