import Quill from "quill";
const Embed = Quill.import("blots/embed");
import { sanitize } from "quill/formats/link";
import { Subscription } from "rxjs";
import { catchError, finalize, take } from "rxjs/operators";
import { ImageDimension, MediaData, MediaIconData, MediaImageData } from "./quill-media.interfaces";

class MediaImageBlot extends Embed {
    private uploadSubscription: Subscription;
    private cancelUploadingSubscription: Subscription;

    static create(data: MediaImageData) {
        const node = super.create(data);
        node.classList.add("ql-media-image");
        if (!data) { return node; }
        node.setAttribute("data-type", data.type);
        const link = document.createElement("a");
        link.classList.add("ql-media-link");
        link.setAttribute("title", data.name);

        const div = document.createElement("div");
        div.className = "ql-media-container";
        const image = document.createElement("img");
        image.setAttribute("alt", data.name);
        if (typeof data.src === "string") {
            image.setAttribute("src", this.sanitize(data.src));
        }
        if (data.thumbnail) {
            image.classList.add("ql-media-thumbnail");
            image.style.maxWidth = data.thumbnail.maxWidth;
            image.style.maxHeight = data.thumbnail.maxHeight;
            image.style.minWidth = data.thumbnail.minWidth;
            image.style.minHeight = data.thumbnail.minHeight;
        }
        div.appendChild(image);
        link.appendChild(div);

        if (data.value) {
            if (typeof data.value === "string") {
                MediaImageBlot.prepareHref(link, data.value);
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

    static value(domNode: Element): MediaImageData {
        const link = domNode.firstElementChild.firstElementChild;
        const data: MediaData = {
            type: domNode.getAttribute("data-type"),
            name: link.getAttribute("title"),
            value: this.clickValue(link)
        };

        const image = link.firstElementChild.firstElementChild as HTMLElement;
        const thumbnail: ImageDimension = { };
        if (image.style.maxWidth) { thumbnail.maxWidth = image.style.maxWidth; }
        if (image.style.maxHeight) { thumbnail.maxHeight = image.style.maxHeight; }
        if (image.style.minWidth) { thumbnail.minWidth = image.style.minWidth; }
        if (image.style.minHeight) { thumbnail.minHeight = image.style.minHeight; }
        const imageData = {
            src: image.getAttribute("src"),
            thumbnail
        };

        return { ...data, ...imageData };
    }

    private static prepareHref(link: Element, value: string) {
        link.setAttribute("href", this.sanitize(value));
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
    }

    static clickValue(link: Element) {
        return link.getAttribute("href") ?? JSON.parse(link.getAttribute("data-value"));
    }

    static sanitize(url) {
        return sanitize(url, ["http", "https", "data"]) ? url : "//:0";
    }

    constructor(private domNode: Element, private data: MediaImageData) {
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

    private upload() {
        if (this.data.file && this.data.upload) {
            this.cancelUploadingSubscription = this.data.$cancelUploading
                .pipe(take(1))
                .subscribe(() => {
                    this.domNode.classList.add("ql-media-error");
                    this.reset();
                });
            this.domNode.classList.add("ql-media-uploading");
            this.data.$uploadingState.next(true);
            this.uploadSubscription = this.data.upload(this.data.type, this.data.file, this.data.thumbnail)
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
                        MediaImageBlot.prepareHref(link, result);
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

    private reset() {
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
MediaImageBlot.blotName = "mediaimage";
MediaImageBlot.tagName = "span";
MediaImageBlot.className = "ql-media";

export default MediaImageBlot;
