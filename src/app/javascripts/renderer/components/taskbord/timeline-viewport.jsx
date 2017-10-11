import React from 'react';
import _ from 'lodash';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import * as Constants from '../constants'
import Task from './timeline-task'
import Marker from './timeline-marker'
import TimelineCustomDragLayer from './timeline-custom-drag-layer'
import moment from 'moment'
import { findDOMNode } from 'react-dom';
import * as timelineUtil from '../../../utils/timeline'

const TimelineViewport = class TimelineViewport extends React.Component {

  showDragTargetTime(dragTargetPositionTop) {
    this.props.updateDragTargetPositionTop(dragTargetPositionTop)
  }

  /**
   * move a timeline task to droped position.
   *
   * @param  {String} dragKey
   * @param  {Number} moveTo
   */

  moveTask(dragKey, moveTo) {
    let nextTaskList
    const prevTaskList = this.props.taskList
    nextTaskList = timelineUtil.setTaskPositionTop(prevTaskList, dragKey, moveTo)
    if (nextTaskList != prevTaskList) {
      this.props.onUpdateTask(
        this.getWidthResizedTaskList(nextTaskList)
      )
    }
  }

  /**
   * resize a timeline task height from task's required time.
   *
   * @param  {String} dragKey
   * @param  {Number} requiredTime
   */

  resizeTaskHeight(dragKey, requiredTime) {
    let nextTaskList
    const prevTaskList = this.props.taskList
    nextTaskList = timelineUtil.setTaskRequiredTime(prevTaskList, dragKey, requiredTime)
    if (nextTaskList != prevTaskList) this.props.onUpdateTask(nextTaskList)
  }

  /**
   * resize same position tasks width in timeline when task position or task height is changed.
   *
   */

  resizeTaskWidth() {
    this.props.onUpdateTask(this.getWidthResizedTaskList(this.props.taskList))
  }

  /**
   * get with resized tasklist.
   *
   * @param {State} targetTaskList
   * @return {State}
   *
   */

  getWidthResizedTaskList(targetTaskList){
    targetTaskList = targetTaskList || this.props.taskList
    let displayTasks = []
    let breaker = false
    let taskList = targetTaskList
    // get display task array
    taskList.document.nodes.map((block, i) => {
      if (block.type == "separator") breaker = true;
      if (breaker) return
      if (Constants.showInTimeline.indexOf(block.type) >= 0 && block.text != "") displayTasks.push(block)
    })
    // get task position range object
    // key: block key
    // value: [top, bottom]
    let taskPositionRange = {}
    _.each(displayTasks, (block, i) => {
      taskPositionRange[block.key] = [
        block.data.get("positionTop"),
        block.data.get("positionTop") + ((block.data.get("requiredTime") / 60) * Constants.heightPerHour)
      ]
    })
    let prTop, prBottom, tprTop, tprBottom
    // position range roop
    _.each(Constants.positionRange(), (pr) => {
      let resizeWidthKeyList = []
      prTop = pr[0]
      prBottom = pr[1]
      // get same position task key list
      _.map(taskPositionRange, (value, key) => {
        tprTop = value[0]
        tprBottom = value[1]
        if ((prTop > tprTop && prTop < tprBottom) || (prBottom > tprTop && prBottom < tprBottom)) {
          resizeWidthKeyList.push(key)
        }
      })
      // resize same position task width
      if (resizeWidthKeyList.length >= 1) {
        _.each(resizeWidthKeyList, (key, i) => {
          taskList = timelineUtil.setTaskWidth(taskList, key, 55/resizeWidthKeyList.length, i)
        })
      }
    })
    return taskList
  }

  /**
   * check today's timeline or not.
   * @return {Boolean}
   */

  isTodayTimeline(){
    return this.props.date == moment().format("YYYYMMDD")
  }

  /**
   * get scrollTop of timeline DOM.
   * @return {Number}
   */

  getScrollTop(){
    return findDOMNode(this.refs.timeline).scrollTop
  }

  // make task panel html.
  renderTasks(){
    let displayTasks = []
    let breaker = false
    this.props.taskList.document.nodes.map((block, i) => {
      if (block.type == "separator") breaker = true;
      if (breaker) return
      if (Constants.showInTimeline.indexOf(block.type) >= 0 && block.text != "") displayTasks.push(block)
    })
    displayTasks = _.sortBy(displayTasks, (task) => {
      return task.data.get("positionTop")
    })

    let taskComponents = []
    _.each(displayTasks, (block, i) => {
      taskComponents.push(
        <Task
          key={i}
          taskKey={block.key}
          block={block}
          nowMarkerTop={this.props.markerPositionTop}
          dragTargetPositionTop={this.props.dragTargetPositionTop}
          showDragTargetTime={this.showDragTargetTime.bind(this)}
          moveTask={this.moveTask.bind(this)}
          resizeTaskHeight={this.resizeTaskHeight.bind(this)}
          resizeTaskWidth={this.resizeTaskWidth.bind(this)}
          getScrollTop={this.getScrollTop.bind(this)}
        />
      )
    })
    return taskComponents.length > 0 ? taskComponents : null
  }

  render() {
    return (
      <div id="timeline-viewport" className="col-md-5 col-sm-6 hidden-xs" ref="timeline">
        <table>
          <tbody>
            <tr className="">
              <td className="tv-time">
                {_.map(_.range(0, 25), (t, i) => {
                  return <div key={i} className="time">{t + ":" + "00"}</div>
                })}
                <div
                  className="dragTargetTime"
                  style={{
                    top: this.props.dragTargetPositionTop.toString() + 'px'
                  }}
                ><span>{timelineUtil.positionTopToTime(this.props.dragTargetPositionTop)}</span></div>
              </td>
              <td className="tv-task tv-marker">
                {_.map(_.range(1, 50), (m, i) => {
                  let style = (this.props.markerPositionTop > (i+1)*25) && this.isTodayTimeline() ? {backgroundColor: "rgba(250,250,250,0.7)"} : {}
                  return (
                    <Marker
                      key={i}
                      className={i % 2 == 0 ? "markercell marker-border" : "markercell"}
                      showDragTargetTime={this.showDragTargetTime.bind(this)}
                      moveTask={this.moveTask.bind(this)}
                      resizeTaskHeight={this.resizeTaskHeight.bind(this)}
                      dragTargetPositionTop={this.props.dragTargetPositionTop}
                      positionTop={i*25}
                      style={style}
                    />
                  );
                })}
                {this.renderTasks()}
                <TimelineCustomDragLayer />
                <div
                  className="nowmarker"
                  style={{
                    top: this.props.markerPositionTop.toString() + 'px',
                    display: this.isTodayTimeline() ? "inherit" : "none"
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
module.exports = DragDropContext(HTML5Backend)(TimelineViewport);
