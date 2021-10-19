import { HttpClient } from "@angular/common/http";
import { AfterViewInit, Component, ElementRef, OnInit } from "@angular/core";
import Quill from "quill";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import MediaUploader from "src/utils/quill-media/modules/media-uploader";
import { QuillMediaModules } from "src/utils/quill-media/quill-media.interfaces";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, AfterViewInit {
    title = "TestAngularQuill";

    private quill: Quill;
    private uploader: MediaUploader;

    constructor(
        private elem: ElementRef,
        private http: HttpClient) {
    }

    ngOnInit(): void {
    }

    ngAfterViewInit() {
        const modules: QuillMediaModules = {
            toolbar: {
                container: [
                    ["bold", "italic", "underline", "strike"],        // toggled buttons
                    ["blockquote", "code-block"],

                    [{ header: 1 }, { header: 2 }],               // custom button values
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ script: "sub" }, { script: "super" }],      // superscript/subscript
                    [{ indent: "-1" }, { indent: "+1" }],          // outdent/indent
                    [{ direction: "rtl" }],                         // text direction

                    // ["link", "image", { upload: ["image", "audio", "video", "pdf", "word", "excel", "powerpoint"] }],
                    ["link", "image", { upload: ["image", "audio", "video", "file"] }],
                    // ["link", "image", "upload"],

                    [{ size: ["small", false, "large", "huge"] }],  // custom dropdown
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],

                    [{ color: [] }, { background: [] }],          // dropdown with defaults from theme
                    [{ font: [] }],
                    [{ align: [] }],

                    ["clean"]                                    // remove formatting button
                ],
                handlers: {
                    upload: (value: any) => {
                        this.uploader.uploadMedia(value);
                    }
                }
            },
            mediaUploader: {
                upload: (type: string, file: File) => {
                    return of("https://www.google.de").pipe(delay(Math.floor(Math.random() * (10000 - 500 + 1) + 500)));
                },
                // clickHandler: (type: string, name: string, value: any, event: any) => {
                //     console.log(`Click Handler Test - Type: ${type}, Name: ${name}, Value: ${value}`, event);
                // }
            }
        };
        this.quill = new Quill("#editor", {
            theme: "snow",
            modules
        });
        this.uploader = this.quill.getModule("mediaUploader");
    }
}

