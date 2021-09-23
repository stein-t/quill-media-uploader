import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import Quill from 'quill';
import Media from 'src/utils/MediaBlot';
import Upload from 'src/utils/Upload';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'TestAngularQuill';

  // modules = {}
  // content = ''
  constructor(private elem: ElementRef) {
  }

  ngOnInit(): void {
    Quill.register(Media);
  }

  ngAfterViewInit() {
    let quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: {
          container:
          [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            ['blockquote', 'code-block'],

            [{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
            [{ 'direction': 'rtl' }],                         // text direction

            ["link", "image", { "upload": ["image", "audio", "video", "pdf", "word", "excel", "powerpoint" ] }],

            [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            [{ 'font': [] }],
            [{ 'align': [] }],

            ['clean']                                    // remove formatting button
          ],
          handlers: {
            upload(value: string) {
                if (!value) { return; }
                let fileInput = this.container.querySelector('input.ql-image[type=file]');
                if (fileInput == null) {
                  fileInput = document.createElement('input');
                  fileInput.setAttribute('type', 'file');
                  fileInput.setAttribute('accept', 'image/png', 'image/jpeg');
                  fileInput.classList.add('ql-image');
                  fileInput.addEventListener('change', () => {
                    let range = this.quill.getSelection(true);
                    this.quill.uploader.upload(range, fileInput);
                    fileInput.value = '';
                  });
                  this.container.appendChild(fileInput);
                }
                fileInput.click();
            }
          }
        }
      }
    });
    quill.uploader = new Upload(quill);
    quill.uploader.init(this.elem.nativeElement);
  }
}
