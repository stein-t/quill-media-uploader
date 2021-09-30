import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import Quill from 'quill';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { QuillMediaModules } from 'src/utils/quill-media/quill-media.interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'TestAngularQuill';

  constructor(
    private elem: ElementRef,
    private http: HttpClient) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const modules: QuillMediaModules = {
      toolbar: {
        container:
        [
          ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
          ['blockquote', 'code-block'],

          [{ header: 1 }, { header: 2 }],               // custom button values
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ script: 'sub' }, { script: 'super' }],      // superscript/subscript
          [{ indent: '-1' }, { indent: '+1' }],          // outdent/indent
          [{ direction: 'rtl' }],                         // text direction

          // ['link', 'image', { upload: ['image', 'audio', 'video', 'pdf', 'word', 'excel', 'powerpoint' ] }],
          ['link', 'image', { upload: ['image', 'audio', 'video', 'document' ] }],
          // ['link', 'image', { upload: ['media', 'pdf', 'word', 'excel', 'powerpoint' ] }],
          // ['link', 'image', { upload: ['media', 'document' ] }],

          [{ size: ['small', false, 'large', 'huge'] }],  // custom dropdown
          [{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }],          // dropdown with defaults from theme
          [{ font: [] }],
          [{ align: [] }],

          ['clean']                                    // remove formatting button
        ],
        handlers: {
          upload: (value: string) => {
            quill.getModule('mediaUploader').uploadMedia(value);
          }
        }
      },
      mediaUploader: {
        upload: (file: File) => {
          return of('https://www.google.de').pipe(delay(Math.floor(Math.random() * (10000 - 1000 + 1) + 1000)));
        },
        uploadError: (err: HttpErrorResponse) => {
          console.error(err.message);
          return `UploadError: ${err.message}`;
        }
      }
    };
    const quill = new Quill('#editor', {
      theme: 'snow',
      modules
    });
  }
}

