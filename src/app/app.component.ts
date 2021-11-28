import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { AfterViewInit, Component, ElementRef, OnInit } from "@angular/core";
import Quill from "quill";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import MediaUploader from "src/utils/quill-media/modules/media-uploader";
import { MediaUploadControl, QuillMediaModules, QuillMediaMimeTypes } from "src/utils/quill-media/quill-media.interfaces";

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
        const types: QuillMediaMimeTypes = {
            // file: "*/*",
            // file: ["audio/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ],
            image: "image/*",
            audio: "audio/*",
            video: "video/*",
            upload: {
                // image: "image/*",
                // audio: "audio/*",
                // video: "video/*",
                // office: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
                pdf: "application/pdf",
                // word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
                // excel: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
                // powerpoint: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
                office: {
                    // pdf: "application/pdf",
                    word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
                    excel: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
                    powerpoint: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
                },
                file: "*/*"
            }
        };
        const uploadControl: MediaUploadControl = MediaUploader.buildControl(
            (value: string) => this.uploader.uploadMedia(value),
            types
        );
        const modules: QuillMediaModules = {
            toolbar: {
                container: [
                    ["bold", "italic", "underline", "strike"],          // toggled buttons
                    ["blockquote", "code-block"],

                    [{ header: 1 }, { header: 2 }],                     // custom button values
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ script: "sub" }, { script: "super" }],           // superscript/subscript
                    [{ indent: "-1" }, { indent: "+1" }],               // outdent/indent
                    [{ direction: "rtl" }],                             // text direction

                    ["link", ...uploadControl.Tools],

                    [{ size: ["small", false, "large", "huge"] }],      // custom dropdown
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],

                    [{ color: [] }, { background: [] }],                // dropdown with defaults from theme
                    [{ font: [] }],
                    [{ align: [] }],

                    ["clean"]                                           // remove formatting button
                ],
                handlers: uploadControl.Handlers
            },
            mediaUploader: {
                upload: (type: string, file: File) => {
                    return of("https://www.google.de").pipe(delay(Math.floor(Math.random() * (10000 - 500 + 1) + 500)));
                },
                uploadError: (type: string, file: string, err: HttpErrorResponse) => {
                    const message = `Failed to upload file ${file}. ${err.status ? err.status + ": " : ""}${err.statusText ? err.statusText + " " : ""}${err.message}`;
                    console.warn(message);
                    window.alert(message);
                },
                types
            }
        };
        this.quill = new Quill("#editor", {
            theme: "snow",
            modules
        });
        this.uploader = this.quill.getModule("mediaUploader");
    }
}

