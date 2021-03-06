import React from 'react';
import ReactDOM from 'react-dom';
import log from 'electron-log';
import _ from 'lodash';
import moment from 'moment';
import { Raw } from 'slate';
import { ipcRenderer } from 'electron';
import Howto from '../../../data/howto.json';
import Header from './header';
import Footer from './footer';
import TimelineViewport from './taskbord/timeline-viewport';
import CalendarViewport from './taskbord/calendar-viewport';
import TaskViewport from './taskbord/task-viewport';
import loginComponet from './login';
import injectTapEventPlugin from 'react-tap-event-plugin';
import * as Constants from './constants';
import * as dateListUtil from '../../utils/date-list';
import * as taskListUtil from '../../utils/task-list';
import * as auth from '../infrastructure/auth'
import * as database from '../infrastructure/database';
import { Timer } from '../../modules/timer';
injectTapEventPlugin();

let updateMarkerTimer;
let saveTaskListTimer;
const serializedInitialData = require("../../../data/initial.json");
const initialTaskList = Raw.deserialize(serializedInitialData, { terse: true });
const HowtoContents = Raw.deserialize(Howto, { terse: true })
const today = moment().format("YYYYMMDD")
const taskBoardDefaultState = {
  currentUser: null,
  date: today,
  taskList: initialTaskList,
  showHowto: false,
  nextTaskPositionTop: Constants.initialPositionTop,
  dragTargetPositionTop: Constants.initialDragTargetPositionTop,
  markerPositionTop: Constants.markerPositionTop(),
  showHistory: true,
  dateList: Constants.initialDateList(),
  syncStatus: Constants.syncStatuses.synced,
  syncedAt: moment().format('YYYY/MM/DD hh:mm:ss')
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
        dateList: action.dateList,
        syncStatus: Constants.syncStatuses.notSynced
      };
    case 'UPDATE_DATE':
      return {
        date: action.date,
        taskList: action.taskList,
        nextTaskPositionTop: action.nextTaskPositionTop,
        dateList: action.dateList,
        showHowto: false,
        syncStatus: Constants.syncStatuses.notSynced
      };
    case 'UPDATE_DRAG_TARGET_POSITION_TOP':
      return {
        dragTargetPositionTop: action.dragTargetPositionTop
      };
    case 'UPDATE_MARKER':
      return {
        taskList: action.taskList,
        markerPositionTop: action.markerPositionTop
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
    case 'UPDATE_SYNC_STATUS':
      return {
        syncStatus: action.syncStatus,
        syncedAt: action.syncedAt
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

  setCurrentUser(currentUser){
    this.dispatch({ type: 'UPDATE_CURRENT_USER', currentUser: currentUser });
  }

  removeCrrentUser(){
    return auth.signOut()
      .then(
        () => {
          this.dispatch({ type: 'UPDATE_CURRENT_USER', currentUser: null });
        }
      )
  }

  updateTask(taskList){
    if(!!updateMarkerTimer) updateMarkerTimer.reset()
    this.dispatch({
      type: 'UPDATE_TASK',
      taskList: taskList,
      nextTaskPositionTop: this.getNextTaskPositionTop(taskList, this.state.date),
      dateList: this.getNextDateList(taskList, this.state.date)
    });
  }

  updateDate(date){
    // save prev taskList.
    this.saveTaskList(this.state.date, this.state.taskList)
    // retrieve next taskList by date.
    database.fetchTaskList(this.state.currentUser.uid, date)
      .then(
        (res) => {
          let nextTaskList = res.taskList
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

  updateDateList(dateList, dateFrom, dateTo = dateFrom){
    database.fetchTaskListByDateRange(this.state.currentUser.uid, dateFrom, dateTo)
      .then(
        (res) => {
          this.dispatch({
            type: 'UPDATE_DATE_LIST',
            dateList: dateListUtil.getDateListWithTaskCountByTaskLists(dateList, res.taskLists)
          });
        }
      )
  }

  updateDragTargetPositionTop(dragTargetPositionTop){
    this.dispatch({ type: 'UPDATE_DRAG_TARGET_POSITION_TOP', dragTargetPositionTop: dragTargetPositionTop})
  }

  updateMarker(){
    this.dispatch({
      type: 'UPDATE_MARKER',
      markerPositionTop: Constants.markerPositionTop(),
      taskList: taskListUtil.updateCurrentFlag(this.state.taskList)
    });
  }

  showHowtoContent(){
    this.saveTaskList(this.state.date, this.state.taskList)
    this.dispatch({ type: 'SHOW_HOWTO' })
  }

  showHistoryMenu(){
    this.dispatch({ type: 'SHOW_HISTORY' })
  }

  hideHistoryMenu(){
    this.dispatch({ type: 'HIDE_HISTORY' })
  }

  updateSyncStatus(syncStatus, syncedAt){
    this.dispatch({
      type: 'UPDATE_SYNC_STATUS',
      syncStatus: syncStatus,
      syncedAt: syncedAt || this.state.syncedAt
    })
  }

  signOut(){
    this.terminateTaskBoard()
      .then(
        () => { this.leaveTaskBoard() }
      )
      .catch(
        (error) => {
          log.error(error.message)
          this.leaveTaskBoard()
        }
      )
  }

  terminateTaskBoard(){
    updateMarkerTimer.stop()
    saveTaskListTimer.stop()
    return this.saveTaskList(this.state.date, this.state.taskList)
  }

  leaveTaskBoard(){
    this.removeCrrentUser()
      .then(
        () => {
          const root = document.getElementById('root');
          ReactDOM.render(React.createElement(loginComponet), root);
        }
      )
  }

  isNotSynced() {
    return this.state.syncStatus == Constants.syncStatuses.notSynced
  }

  isStorableTaskList(){
    return (
      this.isNotSynced()
        && (! this.state.showHowto)
        && this.state.currentUser !== null
    )
  }

  saveTaskList(date, taskList){
    if (this.isStorableTaskList()) {
      this.updateSyncStatus(Constants.syncStatuses.syncing)
      return database.storeTaskList(this.state.currentUser.uid, date, taskList)
        .then(
          () => {
            this.updateSyncStatus(
              Constants.syncStatuses.synced,
              moment().format('YYYY/MM/DD hh:mm:ss')
            )
          }
        )
    } else {
      return Promise.resolve()
    }
  }

  getNextTaskPositionTop(taskList, date){
    let bottom = 450
    let requiredTime = 0
    let breaker = false
    let showInTimelineTaskCount = taskListUtil.getShowInTimelineTaskCount(taskList)
    if (showInTimelineTaskCount == 0) {
      return Constants.initialPositionTop
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
    // initialize dateList
    const dateList = this.state.dateList
    this.updateDateList(dateList, dateList[0].date, dateList[dateList.length - 1].date)

    // set interval for markerPositionTop
    updateMarkerTimer = new Timer(() => {
      this.updateMarker()
    }, Constants.updateMarkerIntervalTime );

    // set interval for store taskList
    saveTaskListTimer = new Timer(() => {
      this.saveTaskList(this.state.date, this.state.taskList);
    }, Constants.saveTaskListIntervalTime );

    // set store and stop event called from main process via ipc.
    ipcRenderer.on('application:quit', (e, data) => {
      this.terminateTaskBoard()
    })
  }

  componentWillMount(){
    // initialize currentUser
    const currentUser = auth.getCurrentUser();
    this.setCurrentUser(currentUser);

    // initialize taskList
    database.fetchTaskList(currentUser.uid, today)
      .then(
        (res) => { this.updateTask(res.taskList) }
      )
  }

  render() {
    return (
      <div id="task-board" className="wrapper">
        <div className="container-fluid">
          <div className="row">
            <CalendarViewport
              date={this.state.date}
              taskList={this.state.taskList}
              onSignOut={this.signOut.bind(this)}
              onUpdateDate={this.updateDate.bind(this)}
              onUpdateDateList={this.updateDateList.bind(this)}
              showHistoryMenu={this.showHistoryMenu.bind(this)}
              hideHistoryMenu={this.hideHistoryMenu.bind(this)}
              dateList={this.state.dateList}
              showHistory={this.state.showHistory}
              currentUser={this.state.currentUser}
              syncStatus={this.state.syncStatus}
              syncedAt={this.state.syncedAt}
            />
            <TaskViewport
              date={this.state.date}
              taskList={this.state.taskList}
              nextTaskPositionTop={this.state.nextTaskPositionTop}
              onUpdateTask={this.updateTask.bind(this)}
              onUpdateDate={this.updateDate.bind(this)}
              onUpdateDateAndTask={this.updateDateAndTask.bind(this)}
              saveTaskList={this.saveTaskList.bind(this)}
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
