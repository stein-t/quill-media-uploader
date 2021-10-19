import { MediaIconData } from "../quill-media.interfaces";
import MediaBase from "./media-base";

class MediaIcon extends MediaBase {
    static create(data: MediaIconData) {
        const node = super.create(data);
        node.classList.add("ql-media-icon");
        const link = node.firstElementChild;
        const div = document.createElement("div");
        div.className = "ql-media-container";
        const icon = document.createElement("i");
        icon.className = !!data.iconClass ? `${data.iconClass} ${data.iconSize}` : `fas fa-file-${data.type} ${data.iconSize}`;
        icon.setAttribute("data-size", data.iconSize);
        if (data.iconClass) { icon.setAttribute("data-icon", data.iconClass); }
        const caption = document.createElement("span");
        caption.className = "caption";
        caption.textContent = data.name;
        div.appendChild(icon);
        div.appendChild(caption);
        link.appendChild(div);
        node.appendChild(link);
        return node;
    }

    static value(domNode: Element): MediaIconData {
        const data = super.value(domNode);
        const icon = domNode.firstElementChild.firstElementChild.firstElementChild.firstElementChild;
        const iconData = {
            iconSize: icon.getAttribute("data-size"),
            iconClass: icon.getAttribute("data-icon")
        };
        return { ...data, ...iconData };
    }

    constructor(protected domNode: Element, protected data: MediaIconData) {
        super(domNode, data);
    }
}
MediaIcon.blotName = "mediaicon";

export default MediaIcon;
