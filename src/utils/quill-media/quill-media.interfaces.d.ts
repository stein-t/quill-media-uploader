import { QuillModules, QuillToolbarConfig } from "ngx-quill";
import { Observable, Subject } from "rxjs";

export interface QuillMediaBaseConfig {
    upload?: (type: string, file: File) => Observable<any>;
    uploadSuccess?: (type: string, file: string, value: any) => void;
    uploadError?: (type: string, file: string, err: any) => void;
    uploadCancelled?: (type: string, file: string) => void;
}

export interface QuillMediaConfig extends QuillMediaBaseConfig {
    iconSize?: string;
    thumbnail?: ImageDimension;
    mimetypes?: QuillMimeTypes;
    translate?: (key: string) => string;
    clickHandler?: (event: JQuery.ClickEvent<HTMLElement, undefined, any, any>, type: string, name: string, value: any) => any;
}

export interface MediaData extends QuillMediaBaseConfig {
    name: string;
    type: string;
    value?: any;
    file?: File;
    $cancelUploading?: Observable<boolean>;
    $uploadingState?: Subject<boolean>;
    $dispose?: Observable<boolean>;
}

export interface MediaIconData extends MediaData {
    iconSize: string;
    iconClass?: string;
}

export interface MediaImageData extends MediaData {
    src: string;
    thumbnail: ImageDimension;
}

export declare type QuillMediaToolbarConfig = QuillToolbarConfig & {
    upload?: boolean | string[];
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
    image?: string | string[],
    audio?: string | string[],
    video?: string | string[],
    pdf?: string | string[],
    word?: string | string[],
    excel?: string | string[],
    powerpoint?: string | string[]
}

export interface QuillMimeTypes extends QuillMediaMimeTypes {
    [key: string]: string | string[] | QuillMediaMimeTypes;
}

export interface ImageDimension {
    maxWidth?: string;
    maxHeight?: string;
    minWidth?: string;
    minHeight?: string;
}
