import Quill from "quill";
const History = Quill.import("modules/history");

class MediaHistory extends History {
  record(changeDelta, oldDelta) {
    super.record(changeDelta, oldDelta);
    console.log("DELTA", changeDelta, oldDelta, this.quill.getContents().diff(oldDelta));
    console.log("STACK", this.stack.undo, this.stack.redo);
  }
}

export default MediaHistory;
