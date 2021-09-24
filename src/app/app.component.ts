import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import Quill from 'quill';
import MediaIcon from 'src/utils/MediaIcon';
import MediaUploader from 'src/utils/MediaUploader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'TestAngularQuill';

  constructor(private elem: ElementRef) {
  }

  ngOnInit(): void {
    Quill.register('formats/mediaicon', MediaIcon );
    Quill.register('modules/mediaUploader', MediaUploader);
  }

  ngAfterViewInit() {
    const quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
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

            ['link', 'image', { upload: ['image', 'audio', 'video', 'document' ] }],

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
        mediaUploader: { }
      }
    });
  }
}
