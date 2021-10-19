import { BehaviorSubject, distinctUntilChanged, Subject, Subscription } from "rxjs";
import Quill, { RangeStatic } from "quill";
const Delta = Quill.import("delta");
import Emitter from "quill/core/emitter";
const Embed = Quill.import("blots/embed");
import MediaIconBlot from "./media-icon-blot";
import MediaImageBlot from "./media-image-blot";
import { MediaIconData, MediaImageData, QuillMediaConfig, QuillMediaMimeTypes } from "./quill-media.interfaces";
import * as $ from "jquery";

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
        Quill.register("formats/mediaicon", MediaIconBlot);
        Quill.register("formats/mediaimage", MediaImageBlot);
    }

    static sanitize(ret: string) {
        // remove uploading icons
        return ret.replace(/mediaicon uploading/g, "mediaicon error");
    }

    static handleClick(
        event: JQuery.ClickEvent<HTMLElement, undefined, any, any>,
        clickHandler: (event: JQuery.ClickEvent<HTMLElement, undefined, any, any>, type: string, name: string, value: any) => any
    ): any {
        event.preventDefault();
        const link = $(event.target).closest("a.ql-media-link");
        const root = $(link[0]).closest("a.ql-media");
        const value = MediaIconBlot.clickValue(link[0]);
        const filename = link[0].getAttribute("title");
        const type = root[0].getAttribute("data-type");
        return clickHandler(event, type, filename, value);
    }

    constructor(
        protected quill: Quill,
        protected options: QuillMediaConfig
    ) {
        this.options.mimetypes = Object.assign(MediaUploader.DEFAULTS.mimetypes, this.options.mimetypes);
        this.options = Object.assign(MediaUploader.DEFAULTS, this.options);
        this.toolbar = this.quill.getModule("toolbar");
        this.layout();
        if (this.options.clickHandler) {
            $(quill.root).on(
              "click", "a.ql-media.ql-active",
              event => MediaUploader.handleClick(event, this.options.clickHandler));
        }
    }

    dispose() {
        if (this.uploadingStateSubscription) {
            this.uploadingStateSubscription.unsubscribe();
            this.uploadingStateSubscription = null;
        }
        this.disposeSubject.next(true);
        if (this.options.clickHandler) {
            $(this.quill.root).off("click", "a.ql-media.ql-active");
        }
    }

    uploadMedia(value?: boolean | string, iconClass?: string) {
        if (!value) { return; }
        let fileInput = this.toolbar.container.querySelector("input.ql-mediauploader[type=file]");
        if (fileInput == null) {
            fileInput = document.createElement("input");
            fileInput.setAttribute("type", "file");
            fileInput.classList.add("ql-mediauploader");
            fileInput.onchange = () => {
                const range = this.quill.getSelection(true);
                if (fileInput.files != null && fileInput.files[0] != null) {
                    const file = fileInput.files[0];
                    value = this.getMediaType(file.type, this.options.mimetypes);
                    if (!value) {
                        console.warn(`File type ${file.type} not supported!`);
                        return;
                    }
                    const uploadingState = new BehaviorSubject<boolean>(false);
                    this.uploadingStates.push(uploadingState);
                    this.uploadingStateSubscription = uploadingState.subscribe(state => this.notifyUploadingState(state));
                    if (value === "image") {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const blot: { mediaimage: MediaImageData} = {
                                mediaimage: {
                                    name: file.name, type: `${value}`, file, src: e.target.result as string, thumbnail: this.options.thumbnail,
                                    upload: this.options.upload, uploadSuccess: this.options.uploadSuccess,
                                    uploadError: this.options.uploadError, uploadCancelled: this.options.uploadCancelled,
                                    $cancelUploading: this.$cancelUploading, $uploadingState: uploadingState, $dispose: this.$dispose
                                }
                            };
                            this.updateContent(range, blot);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        const blot: { mediaicon: MediaIconData} = {
                            mediaicon: {
                                name: file.name, type: `${value}`, file, iconClass, iconSize: this.options.iconSize,
                                upload: this.options.upload, uploadSuccess: this.options.uploadSuccess,
                                uploadError: this.options.uploadError, uploadCancelled: this.options.uploadCancelled,
                                $cancelUploading: this.$cancelUploading, $uploadingState: uploadingState, $dispose: this.$dispose
                            }
                        };
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

    private getMimetypes(value?: boolean | string): string[] {
        if (!value) { return []; }
        let mimetypes = typeof(value) === "string" ? this.options.mimetypes[value] : this.options.mimetypes;
        if (!(Array.isArray(mimetypes) || typeof mimetypes === "string")) {
            mimetypes = Object.entries(mimetypes).reduce((newObj, [key, val]) => {
                return (Array.isArray(val) || typeof val === "string") ? newObj.concat(val) : newObj;
            }, []);
        }
        return Array.isArray(mimetypes) ? mimetypes : [mimetypes];
    }

    private getMediaType(fileType: string, options: string[] | string | QuillMediaMimeTypes): string {
        const compare = (value: string) => {
            if (value === fileType) {
                return true;
            }
            const match = value.match(/^(\w+)\/(.*)$/);
            if (match && match[2] === "*" && match[1] === mainType) {
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

    private layout() {
        const uploadItems: NodeListOf<HTMLElement> = this.toolbar.container.querySelectorAll(".ql-upload .ql-picker-label");
        const title = this.options.translate ? this.options.translate("upload") : "Upload";
        uploadItems.forEach(item => {
            item.setAttribute("title", title);
        });
        const uploadPickerItems: NodeListOf<HTMLElement> = this.toolbar.container.querySelectorAll(".ql-upload .ql-picker-item");
        uploadPickerItems.forEach(item => {
            const label = document.createElement("span");
            label.textContent = this.options.translate ? this.options.translate(item.dataset.value) : item.dataset.value;
            item.appendChild(label);
        });
    }
}

MediaUploader.DEFAULTS = {
    iconSize: "fa-3x",
    thumbnail: {
        maxWidth: "180px",
        maxHeight: "60px",
        minWidth: "10px",
        minHeight: "10px"
    },
    translate: value => {
        return value[0].toUpperCase() + value.slice(1);     // capitalize first letter
    },
    mimetypes: {
        image: "image/*",
        audio: "audio/*",
        video: "video/*",
        pdf: "application/pdf",
        word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        excel: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        powerpoint: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        file: {
            pdf: "application/pdf",
            word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
            excel: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
            powerpoint: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
        }
    }
};

export default MediaUploader;
