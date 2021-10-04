import Quill from 'quill';
const Embed = Quill.import('blots/embed');
import { sanitize } from 'quill/formats/link';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MediaIcon } from './quill-media.interfaces';

class MediaIconBlot extends Embed {
  private uploadSubscription: Subscription;

  static create(data: MediaIcon) {
    const node = super.create(data);
    if (!data) {
      return node;
    }
    const link = document.createElement('a');
    link.className = 'medialink';
    link.setAttribute('title', data.name);
    link.setAttribute('data-filetype', data.icon);
    const icon = document.createElement('i');
    icon.className = `fas fa-file-${data.icon} fa-3x`;
    const caption = document.createElement('span');
    caption.className = 'caption';
    caption.textContent = data.name;
    link.appendChild(icon);
    link.appendChild(caption);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener');
    node.appendChild(link);
    if (data.url) {
      link.setAttribute('href', MediaIconBlot.sanitize(data.url));
    } else if (data.file && data.upload) {
      node.classList.add('uploading');
    } else {
      node.classList.add('error');
    }
    return node;
  }

  static value(domNode: Element): MediaIcon {
    const link = domNode?.firstElementChild?.firstElementChild;
    const data: MediaIcon = {
      name: link?.getAttribute('title'),
      icon: link?.getAttribute('data-filetype'),
      url: link?.getAttribute('href')
    };
    return data;
  }

  private static sanitize(url) {
    return sanitize(url, ['http', 'https']) ? url : '//:0';
  }

  constructor(private domNode: Element, private data: MediaIcon) {
    super(domNode);
  }

  attach() {
    super.attach();
    // if (this.data.history) { this.data.history.ignoreChange = true; }
    this.upload();
  }

  detach() {
    super.detach();
    this.reset();
  }

  private upload() {
    if (this.data.file && this.data.upload) {
      this.domNode.classList.add('uploading');
      this.uploadSubscription = this.data.upload(this.data.file)
        .pipe(
          finalize(() => this.reset()),
          catchError((err: any) => {
            this.domNode.classList.add('error');
            if (this.data.uploadError) {
              return this.data.uploadError(err);
            }
            const message = 'UploadError';
            console.error(message, err);
            this.reset();
            return message;
          })
        )
        .subscribe(url => {
          const link = this.domNode?.firstElementChild?.firstElementChild;
          if (link) {
            link.setAttribute('href', MediaIconBlot.sanitize(url));
          }
          this.reset();
          if (this.data.uploaded) {
            this.data.uploaded(url);
          }
        });
    }
  }

  private reset() {
    if (this.uploadSubscription) {
      this.domNode.classList.remove('uploading');
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
      // if (this.data.history) { this.data.history.ignoreChange = false; }
    }
  }
}
MediaIconBlot.blotName = 'mediaicon';
MediaIconBlot.tagName = 'span';
MediaIconBlot.className = 'mediaicon';

export default MediaIconBlot;
