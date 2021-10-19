import { ImageDimension, MediaImageData } from "../quill-media.interfaces";
import { sanitize } from "quill/formats/link";
import MediaBase from "./media-base";

class MediaImage extends MediaBase {
    static create(data: MediaImageData) {
        const node = super.create(data);
        node.classList.add("ql-media-image");
        const link = node.firstElementChild;
        const div = document.createElement("div");
        div.className = "ql-media-container";
        const image = document.createElement("img");
        image.setAttribute("alt", data.name);
        if (typeof data.src === "string") {
            image.setAttribute("src", this.sanitize(data.src));
        }
        if (data.thumbnail) {
            image.classList.add("ql-media-thumbnail");
            image.style.maxWidth = data.thumbnail.maxWidth + "px";
            image.style.maxHeight = data.thumbnail.maxHeight + "px";
            image.style.minWidth = data.thumbnail.minWidth + "px";
            image.style.minHeight = data.thumbnail.minHeight + "px";
        }
        div.appendChild(image);
        link.appendChild(div);
        node.appendChild(link);
        return node;
    }

    static sanitize(url) {
        return sanitize(url, ["http", "https", "data"]) ? url : "//:0";
    }

    static value(domNode: Element): MediaImageData {
        const data = super.value(domNode);
        const image = domNode.firstElementChild.firstElementChild.firstElementChild.firstElementChild as HTMLElement;
        const thumbnail: ImageDimension = { };
        if (image.style.maxWidth) { thumbnail.maxWidth = parseInt(image.style.maxWidth, 10); }
        if (image.style.maxHeight) { thumbnail.maxHeight = parseInt(image.style.maxHeight, 10); }
        if (image.style.minWidth) { thumbnail.minWidth = parseInt(image.style.minWidth, 10); }
        if (image.style.minHeight) { thumbnail.minHeight = parseInt(image.style.minHeight, 10); }
        const imageData = {
            src: image.getAttribute("src"),
            thumbnail
        };
        return { ...data, ...imageData };
    }

    constructor(protected domNode: Element, protected data: MediaImageData) {
        super(domNode, data);
    }
}
MediaImage.blotName = "mediaimage";

export default MediaImage;
