import React from 'react';
import firebase from 'firebase';
import 'firebase/firestore';
import log from 'electron-log';
import _ from 'lodash';
import moment from 'moment';
import { Raw } from 'slate';
import { ipcRenderer } from 'electron';
import Howto from '../../../data/howto.json';
import initialTaskList from '../../../data/initial.json';
import Header from './header';
import Footer from './footer';
import TimelineViewport from './taskbord/timeline-viewport';
import CalendarViewport from './taskbord/calendar-viewport';
import TaskViewport from './taskbord/task-viewport';
import injectTapEventPlugin from 'react-tap-event-plugin';
import * as Constants from './constants';
import * as dateListUtil from '../../utils/date-list';
import * as taskListUtil from '../../utils/task-list';
import * as database from '../infrastructure/database';
injectTapEventPlugin();

// Initialize Cloud Firestore through Firebase
const db = firebase.firestore();

let intervalIds = [];
const HowtoContents = Raw.deserialize(Howto, { terse: true })
const today = moment().format("YYYYMMDD")
const taskBoardDefaultState = {
  currentUser: null,
  date: today,
  taskList: Raw.deserialize(initialTaskList, { terse: true }),
  showHowto: false,
  nextTaskPositionTop: Constants.initialPositionTop,
  dragTargetPositionTop: Constants.initialDragTargetPositionTop,
  markerPositionTop: Constants.markerPositionTop(),
  showHistory: true,
  dateList: Constants.initialDateList()
}

const taskBoardReducer = (state = taskBoardDefaultState, action) => {
  switch (action.type) {
    case 'UPDATE_CURRENT_USER':
      return {
        currentUser: action.currentUser
      };
    case 'UPDATE_TASK':
      return {
        taskList: action.taskList,
        nextTaskPositionTop: action.nextTaskPositionTop,
        dateList: action.dateList
      };
    case 'UPDATE_DATE':
      return {
        date: action.date,
        taskList: action.taskList,
        nextTaskPositionTop: action.nextTaskPositionTop,
        dateList: action.dateList,
        showHowto: false
      };
    case 'UPDATE_DRAG_TARGET_POSITION_TOP':
      return {
        dragTargetPositionTop: action.dragTargetPositionTop
      };
    case 'UPDATE_MARKER':
      return {
        markerPositionTop: Constants.markerPositionTop()
      };
    case 'UPDATE_DATE_LIST':
      return {
        dateList: action.dateList
      };
    case 'SHOW_HOWTO':
      return {
        taskList: HowtoContents,
        showHowto: true
      };
    case 'SHOW_HISTORY':
      return {
        showHistory: true
      };
    case 'HIDE_HISTORY':
      return {
        showHistory: false
      };
    default:
      return state;
  }
}

class TaskBoard extends React.Component {

  constructor(props){
    super(props);
    this.state = taskBoardDefaultState;
  }

  dispatch(action){
    console.log(action.type)
    this.setState(prevState => taskBoardReducer(prevState, action))
  }

  updateCurrentUser(currentUser){
    this.dispatch({ type: 'UPDATE_CURRENT_USER', currentUser: currentUser });
  }

  updateTask(taskList){
    this.dispatch({
      type: 'UPDATE_TASK',
      taskList: taskList,
      nextTaskPositionTop: this.getNextTaskPositionTop(taskList, this.state.date),
      dateList: this.getNextDateList(taskList, this.state.date)
    });
  }

  updateDate(date){
    // store prev taskList.
    database.setDailyDoc(this.state.currentUser.uid, this.state.date, JSON.stringify(Raw.serialize(this.state.taskList).document))
    // retrieve next taskList by date.
    database.getDailyDoc(this.state.currentUser.uid, date)
      .then(
        (res) => {
          let nextTaskList = Raw.deserialize(JSON.parse(res.content), { terse: true })
          this.dispatch({
            type: 'UPDATE_DATE',
            date: date,
            taskList: nextTaskList,
            nextTaskPositionTop: this.getNextTaskPositionTop(nextTaskList, date),
            dateList: this.getNextDateList(nextTaskList, date)
          });
        }
      )
  }

  updateDateAndTask(date, taskList){
    this.dispatch({
      type: 'UPDATE_DATE',
      date: date,
      taskList: taskList,
      nextTaskPositionTop: this.getNextTaskPositionTop(taskList, date),
      dateList: this.getNextDateList(taskList, date)
    });
  }

  updateDateList(dateList, dateFrom, dateTo){
    dateTo = dateTo || dateFrom;
    const currentUser = firebase.auth().currentUser;
    db.collection('users').doc(currentUser.uid).collection('dailyDocs')
      .where("date", ">=", dateFrom)
      .where("date", "<=", dateTo)
      .limit(30)
      .orderBy("date")
      .get()
      .then((querySnapshot) => {
        let dateListWithTaskCount = dateList;
        querySnapshot.forEach((doc) => {
          log.info("RETRIEVE FROM FIRESTORE, DOC ID: ", doc.id);
          dateListWithTaskCount = dateListUtil.getDateListWithTaskCountByDate(
            dateListWithTaskCount,
            Raw.deserialize(JSON.parse(doc.data().content), { terse: true }),
            doc.data().date
          );
        });
        this.dispatch({ type: 'UPDATE_DATE_LIST', dateList: dateListWithTaskCount });
      })
      .catch((error) => {
        log.error("ERROR RETRIEVING FROM FIRESTORE", error);
      });
  }

  updateDragTargetPositionTop(dragTargetPositionTop){
    this.dispatch({ type: 'UPDATE_DRAG_TARGET_POSITION_TOP', dragTargetPositionTop: dragTargetPositionTop})
  }

  updateMarker(){
    this.dispatch({ type: 'UPDATE_MARKER' })
  }

  showHowtoContent(){
    this.dispatch({ type: 'SHOW_HOWTO' })
  }

  showHistoryMenu(){
    this.dispatch({ type: 'SHOW_HISTORY' })
  }

  hideHistoryMenu(){
    this.dispatch({ type: 'HIDE_HISTORY' })
  }

  storeTaskListToFirestore(date, taskList){
    db.collection('users').doc(this.state.currentUser.uid).collection('dailyDocs').doc(date).set({
      content: JSON.stringify(Raw.serialize(taskList).document),
      date: date
    })
    .then(function() {
      log.info('SAVE TO FIRESTORE, DOC ID: ', date);
    })
    .catch(function(error) {
      log.error('ERROR SAVING TO FIRESTORE', error);
    });
  }

  getNextTaskPositionTop(taskList, date){
    let bottom = 450
    let requiredTime = 0
    let breaker = false
    let showInTimelineTaskCount = taskListUtil.getShowInTimelineTaskCount(taskList)
    let prevShowInTimelineTaskCount = taskListUtil.getShowInTimelineTaskCount(this.state.taskList)
    if (showInTimelineTaskCount == 0) {
      return Constants.initialPositionTop
    } else if (showInTimelineTaskCount == prevShowInTimelineTaskCount && date == this.state.date) {
      return this.state.nextTaskPositionTop
    } else {
      taskList.document.nodes.map((block) => {
        if (block.type == "separator") breaker = true
        if (breaker) return
        if (Constants.showInTimeline.includes(block.type) >= 0 && block.text != "") {
          if (block.data.get("positionTop") >= bottom) {
            bottom = block.data.get("positionTop")
            requiredTime = block.data.get("requiredTime")
          }
        }
      })
      if (bottom > 1200) bottom = 1200
    }
    return bottom + (Constants.heightPerHour * (requiredTime / 60))
  }

  getNextDateList(taskList, date){
    return this.state.showHowto ? this.state.dateList : dateListUtil.getDateListWithTaskCountByDate(this.state.dateList, taskList, date)
  }

  componentDidMount(){
    intervalIds.push(setInterval(() => { this.updateMarker() }, 60000));
    let prevTaskList, nextTaskList;
    intervalIds.push(setInterval(() => {
      nextTaskList = this.state.taskList;
      if((! this.state.showHowto) && this.state.currentUser && nextTaskList != prevTaskList) {
        this.storeTaskListToFirestore(this.state.date, nextTaskList);
        prevTaskList = nextTaskList;
      }
    }, 10000));
  }

  componentWillMount(){
    // initialize currentUser
    const currentUser = firebase.auth().currentUser;
    this.updateCurrentUser(currentUser);

    // initialize taskList
    database.getDailyDoc(currentUser.uid, today)
      .then(
        (res) => {
          this.updateTask(Raw.deserialize(JSON.parse(res.content), { terse: true }));
        }
      )
      .catch(
        (error) => {
          this.updateTask(Raw.deserialize(initialTaskList, { terse: true }));
        }
      );

    // initialize dateList
    const dateList = this.state.dateList
    this.updateDateList(dateList, dateList[0].date, dateList[dateList.length - 1].date)
  }

  componentWillUnmount(){
    _.each(intervalIds, (id) => {
      clearInterval(id);
    });
  }

  render() {
    return (
      <div id="task-board" className="wrapper">
        <div className="container-fluid">
          <div className="row">
            <CalendarViewport
              date={this.state.date}
              taskList={this.state.taskList}
              onUpdateCrrentUser={this.updateCurrentUser.bind(this)}
              onUpdateDate={this.updateDate.bind(this)}
              onUpdateDateList={this.updateDateList.bind(this)}
              showHistoryMenu={this.showHistoryMenu.bind(this)}
              hideHistoryMenu={this.hideHistoryMenu.bind(this)}
              dateList={this.state.dateList}
              showHistory={this.state.showHistory}
              currentUser={this.state.currentUser}
            />
            <TaskViewport
              date={this.state.date}
              taskList={this.state.taskList}
              nextTaskPositionTop={this.state.nextTaskPositionTop}
              onUpdateTask={this.updateTask.bind(this)}
              onUpdateDate={this.updateDate.bind(this)}
              onUpdateDateAndTask={this.updateDateAndTask.bind(this)}
              storeTaskListToFirestore={this.storeTaskListToFirestore.bind(this)}
              onClickShowHowto={this.showHowtoContent.bind(this)}
              showHowto={this.state.showHowto}
              markerPositionTop={this.state.markerPositionTop}
              currentUser={this.state.currentUser}
            />
            <TimelineViewport
              date={this.state.date}
              taskList={this.state.taskList}
              dragTargetPositionTop={this.state.dragTargetPositionTop}
              updateDragTargetPositionTop={this.updateDragTargetPositionTop.bind(this)}
              markerPositionTop={this.state.markerPositionTop}
              onUpdateTask={this.updateTask.bind(this)}
            />
          </div>
        </div>
      </div>
    );
  }
}

module.exports = class MainContent extends React.Component {
  render() {
    return(
      <div className="window">
        <div id="window-content" className="window-content">
          <Header></Header>
          <TaskBoard></TaskBoard>
          <Footer></Footer>
        </div>
      </div>
    );
  }
};
