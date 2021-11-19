import { distinctUntilChanged } from "rxjs/operators";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import Quill, { RangeStatic } from "quill";
const Delta = Quill.import("delta");
import Emitter from "quill/core/emitter";
const Embed = Quill.import("blots/embed");
import MediaIcon from "../formats/media-icon";
import MediaImage from "../formats/media-image";
import { MediaUploadControl, MediaData, MediaImageData, QuillMediaConfig, QuillMediaMimeTypes, QuillMimeTypes } from "../quill-media.interfaces";
import MediaBase from "../formats/media-base";

class MediaUploader {
    static DEFAULTS: QuillMediaConfig;

    private toolbar: any;

    private cancelUploadingSubject = new Subject<boolean>();
    private $cancelUploading = this.cancelUploadingSubject.asObservable();

    private disposeSubject = new Subject<boolean>();
    private $dispose = this.disposeSubject.asObservable();

    private uploadingStates: BehaviorSubject<boolean>[] = [];
    private uploadingStateSubject = new BehaviorSubject<boolean>(false);
    public $uploadingState = this.uploadingStateSubject.asObservable().pipe(distinctUntilChanged());
    private uploadingStateSubscription: Subscription;

    static register() {
        Quill.register("formats/mediaicon", MediaIcon);
        Quill.register("formats/mediaimage", MediaImage);
    }

    static sanitize(ret: string, removeError = false, removeDataImage = false) {
        ret = ret.replace(/ql-media-uploading/gm, "ql-media-error");
        if (removeError) {
            const regex = /<span class=\"ql\-media(?!<span)*?ql\-media\-error.*?<\/a><\/span>.*?<\/span>/gm;
            ret = ret.replace(regex, "");
        }
        if (removeDataImage) {
            const regex = /(<div\sclass=\"ql\-media\-container\"><img src=\")data:.*?\"/gm;
            ret = ret.replace(regex, "$1\"");
        }
        return ret;
    }

    static handleClick(
        event: any,
        clickHandler: (type: string, name: string, value: any, event: any) => any
    ): any {
        event.preventDefault();
        const link = event.target.closest("a.ql-media-link");
        const root = link.closest("span.ql-media");
        const value = MediaBase.clickValue(root, link);
        const filename = link.getAttribute("title");
        const type = root.getAttribute("data-type");
        return clickHandler(type, filename, value, event);
    }

    static buildControl(
        handler: (value: string) => void,
        options: QuillMimeTypes = MediaUploader.DEFAULTS.types,
        merge: boolean = false
    ): MediaUploadControl {
        const tools = merge ? [{ upload: this.buildTools(options, false) as string[] }] : this.buildTools(options, true);
        return {
            Tools: tools,
            Handlers: this.buildHandlers(tools, handler)
        };
    }

    private static buildTools(
        options: QuillMimeTypes | QuillMediaMimeTypes,
        merge: boolean
    ) {
        return Object.entries(options).reduce((previous: (string | { upload: string[] })[], [key, val]) => {
            if (val) {
                if (!merge || Array.isArray(val) || typeof val === "string") {
                    return previous.concat(`media-${key}`);
                }
                previous.push({ upload: this.buildTools(val, false) as string[] });
            }
            return previous;
        }, []);
    }

    private static buildHandlers(
        tools: (string | { upload: string[]; })[],
        handler: (value: string) => void,
        init: { [key: string]: (value: string) => void; } = { upload: handler }): { [key: string]: (value: string) => void; } {
            return tools.reduce((p, c) => {
                if (typeof c === "string") {
                    p[c] = handler;
                } else {
                    return this.buildHandlers(c.upload, handler, p);
                }
                return p;
            }, init);
    }

    constructor(
        protected quill: Quill,
        protected options: QuillMediaConfig
    ) {
        this.options = Object.assign(MediaUploader.DEFAULTS, this.options);
        this.toolbar = this.quill.getModule("toolbar");
        this.prepareLayout();
        if (this.options.clickHandler) {
            this.quill.root.addEventListener("click", this.delegateHandler("a.ql-media-link.ql-media-active", this.options.clickHandler));
        }
    }

    dispose() {
        if (this.uploadingStateSubscription) {
            this.uploadingStateSubscription.unsubscribe();
            this.uploadingStateSubscription = null;
        }
        this.disposeSubject.next(true);
        if (this.options.clickHandler) {
            this.quill.root.removeEventListener("click", this.delegateHandler("a.ql-media-link.ql-media-active", this.options.clickHandler));
        }
    }

    uploadMedia(value?: boolean | string) {
        if (!value) { return; }
        if (typeof value === "string") {
            value = value.replace(/^media\-/, "");
        }
        let fileInput = this.toolbar.container.querySelector("input.ql-mediauploader[type=file]");
        if (fileInput == null) {
            fileInput = document.createElement("input");
            fileInput.setAttribute("type", "file");
            fileInput.classList.add("ql-mediauploader");
            fileInput.onchange = () => {
                const range = this.quill.getSelection(true);
                if (fileInput.files != null && fileInput.files[0] != null) {
                    const file = fileInput.files[0];
                    value = this.getMediaType(file.type, this.options.types);
                    if (!value) {
                        console.warn(`File type ${file.type} not supported!`);
                        return;
                    }
                    const uploadingState = new BehaviorSubject<boolean>(false);
                    this.uploadingStates.push(uploadingState);
                    this.uploadingStateSubscription = uploadingState.subscribe(state => this.notifyUploadingState(state));
                    const blot: { mediaicon: MediaData} = {
                        mediaicon: {
                            name: file.name, type: `${value}`, file,
                            upload: this.options.upload, uploadSuccess: this.options.uploadSuccess,
                            uploadError: this.options.uploadError, uploadCancelled: this.options.uploadCancelled,
                            $cancelUploading: this.$cancelUploading, $uploadingState: uploadingState, $dispose: this.$dispose
                        }
                    };
                    if (value === "image") {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const imageblot: { mediaimage: MediaImageData} = {
                                mediaimage: {
                                    ...blot.mediaicon,
                                    ...{
                                        src: e.target.result as string,
                                        thumbnail: this.options.thumbnail
                                    }
                                }
                            };
                            this.updateContent(range, imageblot);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        this.updateContent(range, blot);
                    }
                }
                fileInput.value = "";
            };
            this.toolbar.container.appendChild(fileInput);
        }

        fileInput.setAttribute(
          "accept",
          this.getMimetypes(value).join(", ")
        );
        fileInput.click();
    }

    cancelUploading(): void {
        this.cancelUploadingSubject.next(true);
    }

    private updateContent(range: RangeStatic, blot: typeof Embed) {
        const history = this.quill.getModule("history");
        history.cutoff();
        this.quill.updateContents(
            new Delta().retain(range.index).delete(range.length).insert(blot),
            Emitter.sources.USER
        );
        history.cutoff();
        this.quill.setSelection(range.index + 1, Emitter.sources.SILENT);
    }

    private notifyUploadingState(value: boolean): void {
        if (!value) {
            value = this.uploadingStates.some(o => o.value);
        }
        this.uploadingStateSubject.next(value);
    }

    private getMimetypes(
        value?: boolean | string,
        options: QuillMimeTypes | QuillMediaMimeTypes = this.options.types,
        init: string[] = []): string[] {
        if (!value) { return []; }
        return Object.entries(options).reduce((previous, [key, val]) => {
            return (Array.isArray(val) || typeof val === "string")
                        ? (typeof value === "string" ? (previous && previous.length || key !== value ? previous : (typeof val === "string" ? [val] : val)) : previous.concat(val))
                        : (typeof value === "string" ? (previous && previous.length ? previous : (key === value ? this.getMimetypes(true, val) : this.getMimetypes(value, val, previous))) : previous.concat(this.getMimetypes(value, val)));
        }, init);
    }

    private getMediaType(fileType: string, options: string[] | string | QuillMediaMimeTypes): string {
        const compare = (value: string) => {
            if (value === fileType) {
                return true;
            }
            const match = value.match(/^(\w+)\/\*$/);
            if (match && match[1] === mainType) {
                return true;
            }
        };
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
                    return compare(v);
                })) {
                    return result = key;
                }
            } else if (typeof value === "string") {
                if (compare(value)) {
                    return result = key;
                }
            } else {
                return result = this.getMediaType(fileType, value);
            }
        });
        return result;
    }

    private prepareLayout() {
        // items tooltip
        const uploadItems: NodeListOf<HTMLElement> = this.toolbar.container.querySelectorAll(".ql-upload .ql-picker-label");
        const title = this.options.translate ? this.options.translate("media") : "Media";
        uploadItems.forEach(item => {
            item.setAttribute("title", title);
        });
        // items label text
        const uploadPickerItems: NodeListOf<HTMLElement> = this.toolbar.container.querySelectorAll(".ql-upload .ql-picker-item");
        uploadPickerItems.forEach(item => {
            const value = item.dataset.value.replace(/^media\-/, "");
            const label = document.createElement("span");
            label.textContent = this.options.translate ? this.options.translate(value) : value;
            item.appendChild(label);
        });
        // button items value attribute
        const uploadButtonItems: NodeListOf<HTMLElement> = this.toolbar.container.querySelectorAll(
            "button.ql-media-image, button.ql-media-audio, button.ql-media-video, button.ql-media-file, " +
            "button.ql-media-pdf, button.ql-media-word, button.ql-media-excel, button.ql-media-powerpoint");
        uploadButtonItems.forEach(item => {
            const value = item.className.replace(/^ql\-/, "");
            item.setAttribute("value", value);
            item.classList.add("ql-upload");
        });
    }

    /** taken from https://stackoverflow.com/a/46101063 */
    private delegateHandler(selector: string, handler: (type: string, name: string, value: any, event: PointerEvent) => void) {
        return (event: PointerEvent) => {
            let target = event.target as HTMLElement;
            do {
                if (target.matches(selector)) {
                    MediaUploader.handleClick.call(target, event, handler);
                }
            } while (target !== event.currentTarget && (target = target.parentNode as HTMLElement));
        };
    }
}

MediaUploader.DEFAULTS = {
    thumbnail: {
        maxWidth: 180,
        maxHeight: 60,
        minWidth: 10,
        minHeight: 10
    },
    translate: value => {
        return value[0].toUpperCase() + value.slice(1);     // capitalize first letter
    },
    types: {
        image: "image/*",
        audio: "audio/*",
        video: "video/*",
        pdf: "application/pdf",
        word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        excel: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        powerpoint: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
}
};

export default MediaUploader;
