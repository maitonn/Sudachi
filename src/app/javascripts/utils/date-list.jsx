import _ from 'lodash';
import moment from 'moment';
import { Raw } from 'slate';
import { ipcRenderer } from 'electron';
import * as taskListUtil from './task-list';

/**
 * create initial date
 *
 * @param  {String} date YYYYMMDD
 * @return {Object}
 */

export const createDate = (date) => {
  return ({
    date: moment(date).format("YYYYMMDD"),
    dateFull: moment(date).format("YYYY.M.D ddd"),
    task: 0,
    taskDone: 0,
    complete: false
  });
}

/**
 * get date array object.
 *
 * @param  {String} dateFrom YYYYMMDD
 * @param  {Number} to
 * @param  {Boolean} countDown
 * @return {Array}           [YYYYMMDD]
 */

export const getDateRange = (dateFrom, to, countDown) => {
  let dateRange = [];
  countDown = countDown || false;
  if( ! countDown ) {
    _.each(_.range(0, to), (d, i) => {
      dateRange.push(moment(dateFrom).add(+d, 'd').format("YYYYMMDD"));
    });
  } else {
    _.each(_.range(0, to), (d, i) => {
      dateRange.push(moment(dateFrom).add(-d, 'd').format("YYYYMMDD"));
    });
  }
  return dateRange;
}

/**
 * get array dateList with task count.
 * count task and doneTask of param taskList, and update task count of the day.
 *
 * @param  {Array} dateList
 * @param  {State} taskList
 * @param  {String} date     YYYYMMDD
 * @return {Array}
 */

export const getDateListWithTaskCountByDate = (dateList, taskList, date) => {
  let task = taskListUtil.getTaskCount(taskList)
  let taskDone = taskListUtil.getDoneTaskCount(taskList)
  let targetIndex = _.findIndex(dateList, {date: date})
  dateList[targetIndex] = {
    date: date,
    dateFull: dateList[targetIndex].dateFull,
    task: task,
    taskDone: taskDone,
    complete: (task + taskDone) == taskDone
  }
  return dateList
}
