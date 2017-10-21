import React from 'react';
import { Raw } from 'slate';
import firebase from 'firebase';
import log from 'electron-log';
import TaskEditor from './task-editor';
import moment from 'moment';
import { dialog, remote } from 'electron';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import FlatButton from 'material-ui/FlatButton';
import * as taskListUtil from '../../../utils/task-list';
import initialTaskList from '../../../../data/initial.json';

// Initialize Cloud Firestore through Firebase
const db = firebase.firestore();

const TaskViewport = class TaskViewport extends React.Component {

  onClickYesterday(){
    this.props.onUpdateDate(moment(this.props.date).add(-1, 'd').format("YYYYMMDD"))
  }

  onClickTomorrow(){
    this.props.onUpdateDate(moment(this.props.date).add(1, 'd').format("YYYYMMDD"))
  }

  onClickToday(){
    this.props.onUpdateDate(moment(this.props.date).format("YYYYMMDD"))
  }

  onClickCarryOver(){
    remote.dialog.showMessageBox(
      remote.getCurrentWindow(),{
      type: 'question',
      title: 'Carring Over Unchecked Task?',
      message: 'Carring over today\'s unchecked task to tomorrow?',
      buttons: ['Sure', 'No']
    }, (buttonIndex) => {
      if (buttonIndex === 0) {
        const tomorrow = moment(this.props.date).add(1, 'd').format("YYYYMMDD")
        const taskListOnlyDoneTask = taskListUtil.getTaskListOnlyDoneTask(this.props.taskList)
        const taskListWithoutDoneTask = taskListUtil.getTaskListWithoutDoneTask(this.props.taskList)
        this.props.saveTaskList(this.props.date, taskListOnlyDoneTask)

        db.collection('users').doc(this.props.currentUser.uid).collection('dailyDocs').doc(tomorrow).get().then((doc) => {
          let tomorrowTaskList;
          if (doc.exists) {
            log.info('RETRIEVE DOCUMENT ID: ', doc.id);
            tomorrowTaskList = Raw.deserialize(JSON.parse(doc.data().content), { terse: true });
          } else {
            log.info('NO SUCH DOCUMENT, ID: ', tomorrow);
            tomorrowTaskList = Raw.deserialize(initialTaskList, { terse: true });
          }
          let transform = tomorrowTaskList.transform();
          taskListWithoutDoneTask.document.nodes.forEach((block, index) => {
            transform = transform.insertNodeByKey(
              tomorrowTaskList.document.key,
              (tomorrowTaskList.document.nodes.size + index),
              block
            );
          });
          this.props.onUpdateDateAndTask(tomorrow, transform.apply());
        })
        .catch((error) => {
          log.error("ERROR RETRIEVING FROM FIRESTORE", error);
        });
      }
    })
  }

  mainButtonsStyle(){
    if (this.props.showHowto) {
      return { display: "none" }
    } else {
      return { display: "inline-block", color: "#bdbdbd", minWidth: "50px"}
    }
  }

  backButtonStyle(){
    if (this.props.showHowto) {
      return { display: "inline-block"}
    } else {
      return { display: "none"}
    }
  }

  editorTitle(){
    if (! this.props.showHowto) {
      return (
        moment([this.props.date.slice(0,4), this.props.date.slice(4,6), this.props.date.slice(6,8)].join("-")).format("YYYY.M.D ddd")
      )
    } else {
      return "Howto"
    }
  }

  focusLastBlock(){
    const lastBlock = this.props.taskList.document.getBlocks().last()
    const transform = this.props.taskList
      .transform()
      .moveToRangeOf(lastBlock)
      .moveOffsetsTo(lastBlock.length, lastBlock.length)
      .focus()
    return transform.apply()
  }

  onClickEditorArea(e){
    if (e.target.className == "editor-area") {
      this.props.onUpdateTask(this.focusLastBlock())
    }
  }

  render() {
    return (
      <div id="task-viewport" className="col-md-5 col-sm-6">
        <div className="editor-area" onClick={this.onClickEditorArea.bind(this)}>
          <div className="title">
            <span>{this.editorTitle()}</span>
          </div>
          <TaskEditor
            date={this.props.date}
            taskList={this.props.taskList}
            nextTaskPositionTop={this.props.nextTaskPositionTop}
            onUpdateTask={this.props.onUpdateTask}
            focusLastBlock={this.focusLastBlock.bind(this)}
          />
        </div>
        <div className="task-viewport-buttons">
          <MuiThemeProvider>
            <div>
              <FlatButton
                label="<Prev"
                labelStyle={{color: "#bdbdbd"}}
                onTouchTap={this.onClickYesterday.bind(this)}
                style={this.mainButtonsStyle()}
              />
              <span style={this.mainButtonsStyle()}>{"|"}</span>
              <FlatButton
                label="Next>"
                labelStyle={{color: "#bdbdbd"}}
                onTouchTap={this.onClickTomorrow.bind(this)}
                style={this.mainButtonsStyle()}
              />
              <FlatButton
                label=" "
                className="howto"
                onTouchTap={this.props.onClickShowHowto}
                style={this.mainButtonsStyle()}
              />
              <FlatButton
                label=" "
                className="carry-over"
                onTouchTap={this.onClickCarryOver.bind(this)}
                style={this.mainButtonsStyle()}
              />
              <FlatButton
                label="<Back"
                onTouchTap={this.onClickToday.bind(this)}
                style={this.backButtonStyle()}
              />
            </div>
          </MuiThemeProvider>
        </div>
      </div>
    );
  }
}

module.exports = TaskViewport;
