import Quill from 'quill';
const EmbedBlot = Quill.import('blots/embed');
import { sanitize } from 'quill/formats/link';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MediaIconType } from './quill-media.interfaces';

class MediaIconBlot extends EmbedBlot {
  private uploadSubscription: Subscription;

  static create(data: MediaIconType) {
    const node = super.create(data);
    if (!data.url && !(data.file && data.upload)) {
      return node;
    }
    node.classList.add('mediaicon');
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
    } else {
      node.classList.add('uploading');
    }
    return node;
  }

  static value(domNode: Element): MediaIconType {
    const link = domNode?.firstElementChild?.firstElementChild;
    const icon = link?.firstElementChild;
    const settings: MediaIconType = {
      name: link?.getAttribute('title'),
      icon: link?.getAttribute('data-filetype'),
      url: link?.getAttribute('href')
    };
    return settings;
  }

  private static sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
  }

  constructor(private domNode: Element, private data: MediaIconType) {
    super(domNode);
    this.upload();
  }

  deleteAt(index, length) {
    super.deleteAt(index, length);
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.reset();
    }
  }

  private upload() {
    const link = this.domNode?.firstElementChild?.firstElementChild;
    if (this.data.file && this.data.upload) {
      this.domNode.classList.add('uploading');
      this.uploadSubscription = this.data.upload(this.data.file)
        .pipe(
          catchError((err: any) => {
            this.domNode.firstElementChild.removeChild(link);
            this.domNode.classList.remove('mediaicon');
            if (this.data.uploadError) {
              return this.data.uploadError(err);
            }
            console.error(err);
            return `UploadError`;
          }),
          finalize(() => this.reset())
        )
        .subscribe(value => {
          link.setAttribute('href', MediaIconBlot.sanitize(value));
          this.domNode.classList.remove('uploading');
        });
    }
  }

  private reset() {
    this.uploadProgress = null;
    this.uploadSubscription = null;
  }
}
MediaIconBlot.blotName = 'mediaicon';
MediaIconBlot.tagName = 'span';

export default MediaIconBlot;
