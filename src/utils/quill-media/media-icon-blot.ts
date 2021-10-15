import Quill from "quill";
const Embed = Quill.import("blots/embed");
import { sanitize } from "quill/formats/link";
import { Subscription } from "rxjs";
import { catchError, finalize, take } from "rxjs/operators";
import { MediaIcon } from "./quill-media.interfaces";

class MediaIconBlot extends Embed {
    private uploadSubscription: Subscription;
    private cancelUploadingSubscription: Subscription;

    static create(data: MediaIcon) {
        const node = super.create(data);
        if (!data) {
            return node;
        }
        const link = document.createElement("a");
        link.classList.add("medialink");
        link.setAttribute("title", data.name);
        link.setAttribute("data-type", data.type);
        const icon = document.createElement("i");
        icon.className = !!data.iconClass ? `${data.iconClass} ${data.iconSize}` : `fas fa-file-${data.type} ${data.iconSize}`;
        icon.setAttribute("data-size", data.iconSize);
        const caption = document.createElement("span");
        caption.className = "caption";
        caption.textContent = data.name;
        link.appendChild(icon);
        link.appendChild(caption);
        node.appendChild(link);
        if (!!data.value) {
            if (typeof data.value === "string") {
                MediaIconBlot.prepareHref(link, data.value);
            } else {
                link.setAttribute("data-value", JSON.stringify(data.value));
            }
        } else if (data.file && data.upload) {
            node.classList.add("uploading");
        } else {
            node.classList.add("error");
        }
        return node;
    }

    static value(domNode: Element): MediaIcon {
        const link = domNode?.firstElementChild?.firstElementChild;
        const icon = link?.firstElementChild;
        const data: MediaIcon = {
            name: link?.getAttribute("title"),
            type: link?.getAttribute("data-type"),
            value: this.clickValue(link),
            iconSize: icon.getAttribute("data-size")
        };
        return data;
    }

    static clickValue(link: Element) {
        return link?.getAttribute("href") ?? JSON.parse(link?.getAttribute("data-value"));
    }

    private static sanitize(url) {
        return sanitize(url, ["http", "https"]) ? url : "//:0";
    }

    private static prepareHref(link: Element, value: string) {
        link.setAttribute("href", MediaIconBlot.sanitize(value));
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
    }

    constructor(private domNode: Element, private data: MediaIcon) {
        super(domNode);
        // if (this.data.history) { this.data.history.ignoreChange = true; }
        this.upload();
        if (!!data.$dispose) {
            data.$dispose.pipe(take(1)).subscribe(() => this.reset());
        }
    }

    detach() {
        super.detach();
        if (this.uploadSubscription) {
            this.data.uploadCancelled(this.data.name);
        }
        this.reset();
    }

    private upload() {
        if (this.data.file && this.data.upload) {
            this.cancelUploadingSubscription = this.data.$cancelUploading
                .pipe(take(1))
                .subscribe(() => {
                    this.domNode.classList.add("error");
                    this.reset();
                });
            this.domNode.classList.add("uploading");
            this.data.$uploadingState.next(true);
            this.uploadSubscription = this.data.upload(this.data.file)
                .pipe(
                    finalize(() => this.reset()),
                    catchError(err => {
                        this.domNode.classList.add("error");
                        const message = `[MediaUploader] Failed to upload ${this.data.name}`;
                        if (this.data.uploadError) {
                            this.data.uploadError(this.data.name, err);
                        } else {
                            console.error(message, err);
                        }
                        this.reset();
                        return message;
                    })
                )
                .subscribe(result => {
                    const link = this.domNode?.firstElementChild?.firstElementChild;
                    if (typeof result === "string") {
                        MediaIconBlot.prepareHref(link, result);
                    } else {
                        link.setAttribute("data-value", JSON.stringify(result));
                    }
                    const message = `[MediaUploader] Successfully uploaded ${this.data.name}`;
                    if (this.data.uploadSuccess) {
                        this.data.uploadSuccess(this.data.name, result);
                    } else {
                        // tslint:disable-next-line: no-console
                        console.info(message);
                    }
                    this.reset();
                });
        }
    }

    private reset() {
        if (this.uploadSubscription) {
            this.domNode.classList.remove("uploading");
            this.uploadSubscription.unsubscribe();
            this.cancelUploadingSubscription.unsubscribe();
            this.uploadSubscription = null;
            this.data.$uploadingState.next(false);
            // if (this.data.history) { this.data.history.ignoreChange = false; }
        }
    }
}
MediaIconBlot.blotName = "mediaicon";
MediaIconBlot.tagName = "div";
MediaIconBlot.className = "mediaicon";

export default MediaIconBlot;
