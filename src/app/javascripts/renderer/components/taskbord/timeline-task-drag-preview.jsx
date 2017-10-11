import React, { PropTypes } from 'react';
import * as Constants from '../constants';

const timelineTaskDragPreview = class TimelineTask extends React.Component {
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

  setTaskStyle(data) {
    let top = data.get("positionTop", 500)
    let height = Constants.heightPerHour * data.get("requiredTime", 60) / 60
    let width = data.get("width", 55)
    let marginLeft = data.get("marginLeft", 0)
    let taskStyle = {
      height: height.toString() + 'px',
      width: width.toString() + '%',
      boxShadow: '3px 3px 10px -2px #8a8a8a',
      border: 'none'
    };
    return taskStyle
  }

  render() {
    return (
      <div
        className={this.setTaskClass(this.props.block.data)}
        style={this.setTaskStyle(this.props.block.data)}>
        <span>{this.props.block.text}</span>
      </div>
    )
  }
}

module.exports = timelineTaskDragPreview;
