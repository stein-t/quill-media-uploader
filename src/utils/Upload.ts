import Quill from 'quill';
const Delta = Quill.import('delta');
import Emitter from 'quill/core/emitter';

class Upload {
  constructor(
    private quill,
    private options = {}
  ) { }

  init(element) {
    let uploadPickerItems: NodeListOf<HTMLElement> = element.querySelectorAll(".ql-upload .ql-picker-item");
    uploadPickerItems.forEach(item => {
        let label = document.createElement("span");
        label.textContent = item.dataset.value;
        item.appendChild(label);
    });
  }

  upload(range, fileInput) {
    if (fileInput.files != null && fileInput.files[0] != null) {
      let reader = new FileReader();
      reader.onload = (e) => {
        this.quill.updateContents(new Delta()
          .retain(range.index)
          .delete(range.length)
          .insert({ media: e.target.result })
        , Emitter.sources.USER);
        this.quill.setSelection(range.index + 1, Emitter.sources.SILENT);
        fileInput.value = "";
      }
      reader.readAsDataURL(fileInput.files[0]);
    }
  }
}

export default Upload;
