import { QuillModules } from "ngx-quill";
import { Observable, Subject } from "rxjs";

export interface QuillMediaBaseConfig {
    upload?: (file: File) => Observable<any>;
    uploadSuccess?: (file: string, value: any) => void;
    uploadError?: (file: string, err: any) => void;
    uploadCancelled?: (file: string) => void;
}

export interface QuillMediaConfig extends QuillMediaBaseConfig {
    iconSize?: string;
    thumbnail?: ImageDimension;
    mimetypes?: QuillMimeTypes;
    translate?: (key: string) => string;
    clickHandler?: (event: JQuery.ClickEvent<HTMLElement, undefined, any, any>, file: string, value: any) => any;
}

export interface MediaIconData extends QuillMediaBaseConfig {
    name: string;
    type: string;
    iconSize?: string;
    value?: any;
    file?: File;
    iconClass?: string;
    $cancelUploading?: Observable<boolean>;
    $uploadingState?: Subject<boolean>;
    $dispose?: Observable<boolean>;
}

export interface MediaImageData extends QuillMediaBaseConfig {
    name: string;
    type: string;
    thumbnail?: ImageDimension;
    value?: any;
    file?: File;
    src: string;
    $cancelUploading?: Observable<boolean>;
    $uploadingState?: Subject<boolean>;
    $dispose?: Observable<boolean>;
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

export declare type QuillFileMimeTypes = {
    pdf?: string[] | string,
    word?: string[] | string,
    excel?: string[] | string,
    powerpoint?: string[] | string
}

export declare type QuillMimeTypes = QuillMediaMimeTypes & QuillFileMimeTypes & {
    media?: QuillMediaMimeTypes,
    file?: QuillFileMimeTypes
}

export interface ImageDimension {
    maxWidth?: string;
    maxHeight?: string;
    minWidth?: string;
    minHeight?: string;
}
