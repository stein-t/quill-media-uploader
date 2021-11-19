import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import Quill from "quill";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import MediaHistory from "./utils/quill-media/modules/media-history";
import MediaUploader from "./utils/quill-media/modules/media-uploader";

Quill.register("modules/history", MediaHistory);
Quill.register("modules/mediaUploader", MediaUploader);
MediaUploader.DEFAULTS.types = {
    image: "image/*",
    audio: "audio/*",
    video: "video/*",
    file: {
        pdf: "application/pdf",
        word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        excel: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        powerpoint: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
    }
};

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
