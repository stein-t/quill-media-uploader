import Quill from "quill";
const Embed = Quill.import("blots/embed");
import { sanitize } from "quill/formats/link";
import { Subscription } from "rxjs";
import { catchError, finalize, take } from "rxjs/operators";
import { MediaData } from "../quill-media.interfaces";

abstract class MediaBase extends Embed {
    static blotName;
    static tagName;
    static className;

    protected uploadSubscription: Subscription;
    protected cancelUploadingSubscription: Subscription;

    static create(data: MediaData) {
        const node = super.create(data);
        if (!data) { return node; }
        node.setAttribute("data-type", data.type);
        const link = document.createElement("a");
        link.className = "ql-media-link";
        link.setAttribute("title", data.name);
        if (data.value) {
            if (typeof data.value === "string") {
                this.prepareHref(link, data.value);
            } else {
                link.setAttribute("data-value", JSON.stringify(data.value));
            }
            link.classList.add("ql-media-active");
        } else if (data.file && data.upload) {
            node.classList.add("ql-media-uploading");
        } else {
            node.classList.add("ql-media-error");
        }
        node.appendChild(link);
        return node;
    }

    static value(domNode: Element): MediaData {
        const link = domNode.firstElementChild.firstElementChild;
        const data: MediaData = {
            type: domNode.getAttribute("data-type"),
            name: link.getAttribute("title"),
            value: this.clickValue(link)
        };
        return data;
    }

    protected static prepareHref(link: Element, value: string) {
        link.setAttribute("href", this.sanitize(value));
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
    }

    static clickValue(link: Element) {
        return link.getAttribute("href") ?? JSON.parse(link.getAttribute("data-value"));
    }

    static sanitize(url) {
        return sanitize(url, ["http", "https"]) ? url : "//:0";
    }

    constructor(protected domNode: Element, protected data: MediaData) {
        super(domNode);
        // if (this.data.history) { this.data.history.ignoreChange = true; }
        this.upload();
        if (data.$dispose) {
            data.$dispose.pipe(take(1)).subscribe(() => this.reset());
        }
    }

    detach() {
        super.detach();
        if (this.uploadSubscription) {
            this.data.uploadCancelled(this.data.type, this.data.name);
        }
        this.reset();
    }

    protected upload() {
        if (this.data.file && this.data.upload) {
            this.cancelUploadingSubscription = this.data.$cancelUploading
                .pipe(take(1))
                .subscribe(() => {
                    this.domNode.classList.add("ql-media-error");
                    this.reset();
                });
            this.domNode.classList.add("ql-media-uploading");
            this.data.$uploadingState.next(true);
            this.uploadSubscription = this.data.upload(this.data.type, this.data.file)
                .pipe(
                    finalize(() => this.reset()),
                    catchError(err => {
                        this.domNode.classList.add("ql-media-error");
                        const message = `[MediaUploader] Failed to upload ${this.data.name}`;
                        if (this.data.uploadError) {
                            this.data.uploadError(this.data.type, this.data.name, err);
                        } else {
                            console.error(message, err);
                        }
                        this.reset();
                        return message;
                    })
                )
                .subscribe(result => {
                    const link = this.domNode.firstElementChild.firstElementChild;
                    if (typeof result === "string") {
                        MediaBase.prepareHref(link, result);
                    } else {
                        link.setAttribute("data-value", JSON.stringify(result));
                    }
                    link.classList.add("ql-media-active");
                    const message = `[MediaUploader] Successfully uploaded ${this.data.name}`;
                    if (this.data.uploadSuccess) {
                        this.data.uploadSuccess(this.data.type, this.data.name, result);
                    } else {
                        // tslint:disable-next-line: no-console
                        console.info(message);
                    }
                    this.reset();
                });
        }
    }

    protected reset() {
        if (this.uploadSubscription) {
            this.domNode.classList.remove("ql-media-uploading");
            this.uploadSubscription.unsubscribe();
            this.cancelUploadingSubscription.unsubscribe();
            this.uploadSubscription = null;
            this.data.$uploadingState.next(false);
            // if (this.data.history) { this.data.history.ignoreChange = false; }
        }
    }
}
MediaBase.tagName = "span";
MediaBase.className = "ql-media";

export default MediaBase;
