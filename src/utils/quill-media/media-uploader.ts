import Quill, { RangeStatic } from 'quill';
const Delta = Quill.import('delta');
import Emitter from 'quill/core/emitter';
const EmbedBlot = Quill.import('blots/embed');
import MediaIconBlot from './media-icon-blot';
import { MediaIcon, QuillMediaConfig, QuillMediaConfigDefaults } from './quill-media.interfaces';


class MediaUploader {
  static DEFAULTS: QuillMediaConfigDefaults;
  private toolbar: any;

  constructor(
    protected quill: Quill,
    protected options: QuillMediaConfig
  ) {
    this.options = Object.assign(MediaUploader.DEFAULTS, this.options);
    this.toolbar = this.quill.getModule('toolbar');
    this.layout();

    // ISSUE: addHandler does not work for non-existent handler: https://github.com/KillerCodeMonkey/ngx-quill/issues/104
    // this.toolbar.addHandler('upload', this.uploadMedia.bind(this));
  }

  static register() {
    Quill.register('formats/mediaicon', MediaIconBlot );
  }

  uploadMedia(value: string) {
    if (!value) { return; }
    let fileInput = this.toolbar.container.querySelector('input.ql-mediauploader[type=file]');
    if (fileInput == null) {
      fileInput = document.createElement('input');
      fileInput.setAttribute('type', 'file');
      fileInput.classList.add('ql-mediauploader');
      fileInput.onchange = () => {
        const range = this.quill.getSelection(true);
        if (fileInput.files != null && fileInput.files[0] != null) {
          const file = fileInput.files[0];
          value = this.getMediaType(file.type, this.options.mimetypes);
          if (!value) {
            console.warn(`File type ${file.type} not supported!`);
            return;
          }
          if (value === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => {
              const blot = { image: e.target.result };
              this.updateContent(range, blot);
            };
            reader.readAsDataURL(file);
          } else {
            const blot: { mediaicon: MediaIcon} = {
              mediaicon: {
                name: file.name, icon: `${value}`,
                file, upload: this.options.upload
              }
            };
            this.updateContent(range, blot);
          }
        }
        fileInput.value = '';
      };
      this.toolbar.container.appendChild(fileInput);
    }

    fileInput.setAttribute(
      'accept',
      this.getMimetypes(value).join(', ')
    );
    fileInput.click();
  }

  updateContent(range: RangeStatic, blot: typeof EmbedBlot) {
    this.quill.updateContents(
      new Delta().retain(range.index).delete(range.length).insert(blot),
      Emitter.sources.USER
    );
    this.quill.setSelection(range.index + 1, Emitter.sources.SILENT);
  }

  private getMimetypes(value: string): string[] {
    let mimetypes = this.options.mimetypes[value];
    if (!Array.isArray(mimetypes)) {
      mimetypes = Object.entries(mimetypes).reduce((newObj, [key, val]) => newObj.concat(val), []);
    }
    return mimetypes;
  }

  private getMediaType(fileType: string, options: any): string {
    const mainTypeMatch = fileType.match(/^(\w+)\//);
    let mainType: string;
    if (mainTypeMatch) {
      mainType = mainTypeMatch[1];
    }
    let result: string;
    Object.entries(options).some(val => {
      const key = val[0];
      const value = val[1];
      if (Array.isArray(value)) {
        if (value.some(v => {
          if (fileType === v) {
            return true;
          }
          const match = v.match(/^(\w+)\/(.*)$/);
          if (match && match[2] === '*' && match[1] === mainType) {
            return true;
          }
        })) {
          return result = key;
        }
      } else {
        return result = this.getMediaType(fileType, value);
      }
    });
    return result;
  }

  private layout() {
    const uploadPickerItems: NodeListOf<HTMLElement> = this.toolbar.container.querySelectorAll('.ql-upload .ql-picker-item');
    uploadPickerItems.forEach(item => {
        const label = document.createElement('span');
        label.textContent = this.options.translate ? this.options.translate(item.dataset.value) : item.dataset.value;
        item.appendChild(label);
    });
  }
}

MediaUploader.DEFAULTS = {
  mimetypes: {
    media: {
      image: ['image/*'],
      audio: ['audio/*'],
      video: ['video/*']
    },
    image: ['image/*'],
    audio: ['audio/*'],
    video: ['video/*'],
    document: {
      pdf: ['application/pdf'],
      word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      powerpoint: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    },
    pdf: ['application/pdf'],
    word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    powerpoint: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  }
};

export default MediaUploader;
