import React, { PropTypes } from 'react';
import { DragSource, DropTarget } from "react-dnd";
import * as Constants from '../constants';
import * as timelineUtil from '../../../utils/timeline';
import * as taskEditorUtil from '../../../utils/task-editor';
import Resizer from './timeline-resizer';
import classNames from 'classnames'
import { getEmptyImage } from 'react-dnd-html5-backend';

const taskSource = {
  beginDrag(props) {
    return {
      taskKey: props.taskKey,
      block: props.block
    };
  },
  endDrag(props, monitor) {
    if (monitor.getDropResult() !== null) {
      const dragKey = monitor.getItem().taskKey
      let clientOffsetY = Math.floor(monitor.getDropResult().y) - 115 + props.getScrollTop()
      let moveTo = clientOffsetY - (clientOffsetY % 25)
      if (moveTo != props.block.data.get("positionTop")) props.moveTask(dragKey, moveTo)
    }
    props.showDragTargetTime(Constants.initialDragTargetPositionTop)
  }
}

const taskTarget = {
  hover(props, monitor, component) {
    if (monitor.getItem().resize) {
      let taskKey = monitor.getItem().taskKey
      let initialClientOffsetY = monitor.getInitialClientOffset().y
      let clientOffsetY = monitor.getClientOffset().y
      let tmp = clientOffsetY - initialClientOffsetY
      if (tmp <= 0) tmp -= 25
      let nextRequiredTime = ((Math.floor(tmp / 25) + 1) * 30) + monitor.getItem().initialReqiredTime
      if (nextRequiredTime <= 0) nextRequiredTime = 30
      if (nextRequiredTime == props.block.data.get("requiredTime")) return
      let taskBottomPosition = timelineUtil.getPositionBottom(props.block, nextRequiredTime)
      if(props.dragTargetPositionTop != taskBottomPosition) {
        props.showDragTargetTime(taskBottomPosition)
      }
      props.resizeTaskHeight(taskKey, nextRequiredTime)
    } else {
      let clientOffsetY = Math.floor(monitor.getClientOffset().y) - 115 + props.getScrollTop()
      let moveTo = clientOffsetY - (clientOffsetY % 25)
      if (moveTo == props.dragTargetPositionTop) return
      props.showDragTargetTime(moveTo)
    }
  },
  drop(props, monitor, component) {
    return monitor.getClientOffset()
  }
}

function sourceCollect(connect, monitor){
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }
}

function targetCollect(connect){
  return {
    connectDropTarget: connect.dropTarget()
  }
}

const timelineTask = class TimelineTask extends React.Component {

  setTaskClass(data) {
    let taskClass = "task"
    if ( data.get("done", false) == true) {
      taskClass += " done"
    } else if ( data.get("positionTop", 500) >= 925 ) {
      taskClass += " alert"
    }
    let top = data.get("positionTop", 500)
    let height = Constants.heightPerHour * data.get("requiredTime", 60) / 60
    if (this.props.nowMarkerTop > (top + height) && !data.get("done")) taskClass += " past"
    return taskClass
  }

  setTaskStyle(data, isDragging) {
    let top = data.get("positionTop", 500)
    let height = Constants.heightPerHour * data.get("requiredTime", 60) / 60
    let width = data.get("width", 55)
    let marginLeft = data.get("marginLeft", 0)
    let taskStyle = {
      top: top.toString() + 'px',
      height: height.toString() + 'px',
      width: width.toString() + '%',
      marginLeft: marginLeft.toString() + '%',
      opacity: isDragging ? 0.4 : 1
    };
    return taskStyle
  }

  setTaskTextClass(block, focusKey) {
    return classNames({
      'current-line': taskEditorUtil.isFocusedTask(block.key, focusKey)
    })
  }

  componentDidMount(){
    this.props.connectDragPreview(getEmptyImage(), {
      captureDraggingState: false,
    })
  }

  renderTaskTime(){
    if (this.props.block.data.get("requiredTime") >= 60) {
      let positionTop = this.props.block.data.get("positionTop")
      let positionBottom = timelineUtil.getPositionBottom(this.props.block, this.props.block.data.get("requiredTime"))
      return (
        <span className="task-start-time">
          {
            timelineUtil.positionTopToTime(positionTop)
              + '-'
              + timelineUtil.positionTopToTime(positionBottom)
          }
        </span>
      )
    }
  }

  render() {
    const { isDragging, connectDragSource, connectDragPreview, connectDropTarget, text } = this.props

    return connectDragSource(connectDropTarget(
      <div
        className={this.setTaskClass(this.props.block.data)}
        style={this.setTaskStyle(this.props.block.data, isDragging)}>
        <span className={this.setTaskTextClass(this.props.block, this.props.focusKey)}>{this.props.block.text}</span>
        <Resizer
          taskKey={this.props.taskKey}
          block={this.props.block}
          resizeTaskWidth={this.props.resizeTaskWidth}
          showDragTargetTime={this.props.showDragTargetTime}
        />
      </div>
    ))
  }
}

module.exports = DragSource(Constants.Types.TASK, taskSource, sourceCollect)(DropTarget(Constants.Types.TASK, taskTarget, targetCollect)(timelineTask));
