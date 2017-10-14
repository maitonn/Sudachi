import React from 'react';
import { DragSource, DropTarget } from "react-dnd";
import * as Constants from '../constants';
import { getEmptyImage } from 'react-dnd-html5-backend';

const resizerSource = {
  beginDrag(props) {
    return {
      taskKey: props.taskKey,
      block: props.block,
      resize: true,
      initialReqiredTime: props.block.data.get("requiredTime")
    };
  },
  endDrag(props, monitor) {
    props.resizeTaskWidth()
    props.showDragTargetTime(Constants.initialDragTargetPositionTop)
  }
}

function sourceCollect(connect, monitor){
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }
}

const timelineResizer = class TimelineResizer extends React.Component {

  componentDidMount(){
    this.props.connectDragPreview(getEmptyImage(), {
      captureDraggingState: false,
    })
  }

  render() {
    const { isDragging, connectDragSource, connectDragPreview } = this.props

    return connectDragSource(
      <div className="resizer">=</div>
    )
  }
}

module.exports = DragSource(Constants.Types.TASK, resizerSource, sourceCollect)(timelineResizer)
