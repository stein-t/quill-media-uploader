import { Observable, Subject } from "rxjs";
import MediaBase from "./formats/media-base";
import MediaIcon from "./formats/media-icon";
import MediaImage from "./formats/media-image";
import MediaUploader from "./modules/media-uploader";

// taken from ngx-quill
export interface QuillModules {
    [key: string]: any;
    clipboard?: {
        matchers?: any[];
        matchVisual?: boolean;
    } | boolean;
    history?: {
        delay?: number;
        maxStack?: number;
        userOnly?: boolean;
    } | boolean;
    keyboard?: {
        bindings?: any;
    } | boolean;
    syntax?: boolean;
    toolbar?: QuillToolbarConfig | string | {
        container?: string | string[] | QuillToolbarConfig;
        handlers?: {
            [key: string]: any;
        };
    } | boolean;
}

// taken from ngx-quill
export declare type QuillToolbarConfig = Array<Array<string | {
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
}>>;

export interface QuillMediaBaseConfig {
    upload?: (type: string, file: File) => Observable<any>;
    uploadSuccess?: (type: string, file: string, value: any) => void;
    uploadError?: (type: string, file: string, err: Error) => void;
    uploadCancelled?: (type: string, file: string) => void;
}

export interface QuillMediaConfig extends QuillMediaBaseConfig {
    thumbnail?: ImageDimension;
    types?: QuillMediaMimeTypes;
    acceptAnyFile?: boolean;
    blackFileExtensions?: string[];
    translate?: (key: string) => string;
    clickHandler?: (type: string, name: string, value: any, event: any) => void;
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
    powerpoint?: string | string[],
    [key: string]: string | string[] | QuillMediaMimeTypes;
}

export interface ImageDimension {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
}

export interface MediaUploadControl {
    Tools: (string | { [key: string]: string[] })[],
    Handlers: { [key: string]: (value: string) => void; }
}

export  { MediaUploader, MediaBase, MediaIcon, MediaImage }
