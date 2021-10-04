import { QuillModules } from "ngx-quill";
import { Observable } from "rxjs";

export interface MediaIcon {
  name: string;
  icon: string;
  url?: string;
  file?: File;
  upload?: (file: File) => Observable<string>;
  uploaded?: (url: string) => void;
  uploadError?: (err: any) => string;
}

export interface QuillMediaConfigDefaults {
  [key: string]: any;
  mimetypes: QuillMimeTypes
}

export interface QuillMediaConfig extends Omit<QuillMediaConfigDefaults, 'mimetypes'> {
  mimetypes?: QuillMimeTypes,
  translate?: (key: string) => string,
  upload: (file: File) => Observable<string>,
  uploaded?: (url: string) => void;
  uploadError?: (err: any) => string
}

// take from QuillToolbarConfig
// ISSUE: recommend QuillToolbarConfig to be implemented as a type
export declare type QuillBaseToolbarConfig = {
  indent?: string;
  list?: string;
  direction?: string;
  header?: number | Array<boolean | number>;
  color?: string[] | string;
  background?: string[] | string;
  align?: string[] | string;
  script?: string;
  font?: string[] | string;
  size?: Array<boolean | string>;
}

export declare type QuillMediaBaseToolbarConfig = QuillBaseToolbarConfig & {
  upload?: Array<boolean | string>;
}

export declare type QuillMediaToolbarConfig = Array<Array<string | QuillMediaBaseToolbarConfig>>;

export interface QuillMediaModules extends QuillModules {
  toolbar?: QuillMediaToolbarConfig | string | {
      container?: string | string[] | QuillMediaToolbarConfig;
      handlers?: {
          [key: string]: any;
      };
  } | boolean;
  mediaUploader: QuillMediaConfig
}

export declare type QuillMediaMimeTypes = {
  image?: string[] | string,
  audio?: string[] | string,
  video?: string[] | string,
}

export declare type QuillDocumentMimeTypes = {
  pdf?: string[] | string,
  word?: string[] | string,
  excel?: string[] | string,
  powerpoint?: string[] | string
}

export declare type QuillMimeTypes = QuillMediaMimeTypes & QuillDocumentMimeTypes & {
  media?: QuillMediaMimeTypes,
  document?: QuillDocumentMimeTypes
}

