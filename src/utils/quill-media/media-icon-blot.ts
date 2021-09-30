import { HttpErrorResponse } from '@angular/common/http';
import Quill from 'quill';
const EmbedBlot = Quill.import('blots/embed');
import { sanitize } from 'quill/formats/link';
import { Observable, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

export interface IMediaIconType {
  name: string;
  icon: string;
  size: string;
  url?: string;
  file?: File;
  // upload?: (file: File) => Observable<HttpEvent<string>>;
  upload?: (file: File) => Observable<string>;
}

class MediaIconBlot extends EmbedBlot {
  static create(data: IMediaIconType) {
    const node = super.create(data);
    if (!data.url && !(data.file && typeof data.upload === 'function')) {
      return node;
    }
    node.classList.add('mediaicon');
    const link = document.createElement('a');
    link.className = 'medialink';
    link.setAttribute('title', data.name);
    link.setAttribute('data-filetype', data.icon);
    const icon = document.createElement('i');
    icon.className = `fas fa-file-${data.icon} fa-${data.size}`;
    icon.setAttribute('data-size', data.size);
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

  static value(domNode: Element): IMediaIconType {
    const link = domNode?.firstElementChild?.firstElementChild;
    const icon = link?.firstElementChild;
    const settings = {
      name: link?.getAttribute('title'),
      icon: link?.getAttribute('data-filetype'),
      size: icon?.getAttribute('data-size'),
      url: link?.getAttribute('href')
    };
    return settings;
  }

  private static sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
  }

  private uploadProgress: number;
  private uploadSubscription: Subscription;

  constructor(private domNode: Element, private data: IMediaIconType) {
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
    if (this.data.file && typeof this.data.upload === 'function') {
      this.domNode.classList.add('uploading');
      this.uploadSubscription = this.data.upload(this.data.file)
        .pipe(
          catchError((err: HttpErrorResponse) => {
            this.domNode.firstElementChild.removeChild(link);
            this.domNode.classList.remove('mediaicon');
            console.error(err.message);
            return `UploadError: ${err.message}`;
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
