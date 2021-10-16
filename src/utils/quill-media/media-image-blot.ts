import Quill from "quill";
const Embed = Quill.import("blots/embed");
import { sanitize } from "quill/formats/link";
import { Subscription } from "rxjs";
import { catchError, finalize, take } from "rxjs/operators";
import { MediaIconData, MediaImageData } from "./quill-media.interfaces";

class MediaImageBlot extends Embed {
    private uploadSubscription: Subscription;
    private cancelUploadingSubscription: Subscription;

    static create(data: MediaImageData) {
        const node = super.create(data);
        node.classList.add("ql-media-image");
        if (!data) { return node; }

        const link = document.createElement("a");
        link.classList.add("ql-media");
        link.setAttribute("title", data.name);
        link.setAttribute("data-type", data.type);

        const span = document.createElement("span");
        const image = document.createElement("img");
        image.setAttribute("alt", data.name);
        if (typeof data.src === "string") {
            image.setAttribute("src", this.sanitize(data.src));
        }
        if (!!data.thumbnail) {
            image.classList.add("thumbnail");
            image.style.maxWidth = data.thumbnail.maxWidth;
            image.style.maxHeight = data.thumbnail.maxHeight;
            image.style.minWidth = data.thumbnail.minWidth;
            image.style.minHeight = data.thumbnail.minHeight;
        }
        span.appendChild(image);
        link.appendChild(span);

        if (!!data.value) {
            if (typeof data.value === "string") {
                MediaImageBlot.prepareHref(link, data.value);
            } else {
                link.setAttribute("data-value", JSON.stringify(data.value));
            }
            link.classList.add("ql-active");
            node.classList.add("ql-active");
        } else if (data.file && data.upload) {
            node.classList.add("uploading");
        } else {
            node.classList.add("error");
        }

        node.appendChild(link);
        return node;
    }

    static value(domNode: Element): MediaIconData {
        const link = domNode.firstElementChild?.firstElementChild;
        const image = link?.firstElementChild?.firstElementChild as HTMLElement;
        const data: MediaImageData = {
            name: link?.getAttribute("title"),
            type: link?.getAttribute("data-type"),
            value: this.clickValue(link),
            // iconSize: icon.getAttribute("data-size")
            src: image?.getAttribute("src"),
            thumbnail: {
                maxWidth: image?.style.maxWidth,
                maxHeight: image?.style.maxHeight,
                minWidth: image?.style.minWidth,
                minHeight: image?.style.minHeight
            }
        };
        return data;
    }

    private static prepareHref(link: Element, value: string) {
        link.setAttribute("href", this.sanitize(value));
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
    }

    static clickValue(link: Element) {
        return link?.getAttribute("href") ?? JSON.parse(link?.getAttribute("data-value"));
    }

    static match(url) {
        return /\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url);
    }

    static sanitize(url) {
        return sanitize(url, ["http", "https", "data"]) ? url : "//:0";
    }

    constructor(private domNode: Element, private data: MediaIconData) {
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
                    const link = this.domNode.firstElementChild.firstElementChild;
                    if (typeof result === "string") {
                        MediaImageBlot.prepareHref(link, result);
                    } else {
                        link.setAttribute("data-value", JSON.stringify(result));
                    }
                    link.classList.add("ql-active");
                    this.domNode.classList.add("ql-active");
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
MediaImageBlot.blotName = "mediaimage";
MediaImageBlot.tagName = "span";
MediaImageBlot.className = "ql-media-root";

export default MediaImageBlot;
