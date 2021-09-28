import Quill from 'quill';
const EmbedBlot = Quill.import('blots/embed');
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
    const link = document.createElement('a');
    link.className = 'medialink';
    link.setAttribute('title', value.name);
    link.setAttribute('data-filetype', value.icon);
    link.setAttribute('href', 'https://www.google.de');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener');
    link.setAttribute('data-url', this.sanitize(value.url));
    const icon = document.createElement('i');
    icon.className = `fas fa-file-${value.icon} fa-${value.size}`;
    icon.setAttribute('data-size', value.size);
    const caption = document.createElement('span');
    caption.className = 'caption';
    caption.textContent = value.name;
    link.appendChild(icon);
    link.appendChild(caption);
    node.appendChild(link);
    return node;
  }

  static sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
  }

  static value(domNode: Element): MediaIconType {
    const link = domNode.firstElementChild.firstElementChild;
    const icon = domNode.firstElementChild.firstElementChild.firstElementChild;
    const value = {
      name: link.getAttribute('title'),
      icon: link.getAttribute('data-filetype'),
      size: icon.getAttribute('data-size'),
      url: domNode.getAttribute('data-url')
    };
    return value;
  }
}
MediaIcon.blotName = 'mediaicon';
MediaIcon.tagName = 'span';
MediaIcon.className = 'mediaicon';

export default MediaIcon;
