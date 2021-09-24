import Quill from 'quill';
import * as Parchment from 'parchment';
const EmbedBlot = Quill.import('blots/embed') as typeof Parchment.default.Embed;
import { sanitize } from 'quill/formats/link';

export type MediaIconType = {
  name: string,
  icon: string,
  size: string,
  url: string
};

class MediaIcon extends EmbedBlot {
  static create(value: MediaIconType) {
    const node = super.create(value);
    (node as Element).className = `fas fa-file-${value.icon} fa-${value.size}`;
    (node as Element).setAttribute('title', value.name);
    (node as Element).setAttribute('data-icon', value.icon);
    (node as Element).setAttribute('data-size', value.size);
    (node as Element).setAttribute('data-url', this.sanitize(value.url));
    return node;
  }

  static sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
  }

  static value(domNode: Element) {
    const value: MediaIconType = {
      name: domNode.getAttribute('title'),
      icon: domNode.getAttribute('data-icon'),
      size: domNode.getAttribute('data-size'),
      url: domNode.getAttribute('data-url')
    };
    return value;
  }
}
MediaIcon.blotName = 'mediaicon';
MediaIcon.tagName = 'i';

export default MediaIcon;
