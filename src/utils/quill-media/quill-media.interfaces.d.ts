import { QuillModules, QuillToolbarConfig } from "ngx-quill";
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

export declare type QuillMediaToolbarConfig = QuillToolbarConfig & {
    upload?: string[] | string;
}

export interface QuillMediaModules extends QuillModules {
    toolbar?: QuillMediaToolbarConfig | string | {
        container?: string | string[] | QuillMediaToolbarConfig;
        handlers?: {
            [key: string]: any;
        };
    } | boolean;
    mediaUploader: QuillMediaConfig
}

export interface QuillMediaMimeTypes {
    image?: string[] | string,
    audio?: string[] | string,
    video?: string[] | string,
    pdf?: string[] | string,
    word?: string[] | string,
    excel?: string[] | string,
    powerpoint?: string[] | string,
}

export interface QuillMimeTypes extends QuillMediaMimeTypes {
    [key: string]: string[] | string | QuillMediaMimeTypes;
}

export interface ImageDimension {
    maxWidth?: string;
    maxHeight?: string;
    minWidth?: string;
    minHeight?: string;
}
