import { MediaData } from "../quill-media.interfaces";
import MediaBase from "./media-base";

class MediaIcon extends MediaBase {
    static create(data: MediaData) {
        const node = super.create(data);
        const link = node.firstElementChild;
        const div = document.createElement("div");
        div.className = "ql-media-container";
        const icon = document.createElement("i");
        icon.className = `fas fa-file-${data.type} fa-2x`;
        const caption = document.createElement("span");
        caption.className = "caption";
        caption.textContent = data.name;
        div.appendChild(icon);
        div.appendChild(caption);
        link.appendChild(div);
        node.appendChild(link);
        return node;
    }

    constructor(protected domNode: Element, protected data: MediaData) {
        super(domNode, data);
    }
}
MediaIcon.className = "ql-media-icon";
MediaIcon.blotName = "mediaicon";

export default MediaIcon;
