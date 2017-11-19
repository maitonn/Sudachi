import { Raw, Block } from 'slate';
import { ipcRenderer } from 'electron';
import * as taskEditorUtil from './task-editor';
import * as Constants from '../renderer/components/constants';
import * as database from '../renderer/infrastructure/database'
const initialData = require("../../data/initial.json")
const log = require('electron-log');

/**
 * stringify tasklist.
 * @param  {State} taskList
 * @return {String}
 */

export const stringifyTaskList = (taskList) => {
  return JSON.stringify(Raw.serialize(taskList).document);
}

/**
 * parse string tasklist to state.
 * @param  {String} content
 * @return {State}
 */

export const parseStringTaskList = (content) => {
  return Raw.deserialize(JSON.parse(content), { terse: true });
}

/**
 * whether is done task block or not.
 * @param  {Block}  block
 * @return {Boolean}
 */

export const isDoneTask = (block) => {
  return block.type == "check-list-item" && block.data.get('done')
}

/**
 * whether is separator block or not
 * @param  {Block}  block
 * @return {Boolean}
 */

export const isSeparator = (block) => {
  return block.type == 'separator'
}

/**
 * whether is not done task block or not.
 * @param  {Block}  block
 * @return {Boolean}
 */

export const isNotDoneTask = (block) => {
  return block.type == "check-list-item" && ! block.data.get('done')
}

/**
 * get taskList by date.
 *
 * @param  {String} date YYYYMMDD
 * @return {State}
 */

export const getTaskListByDate = (date) => {
  try {
    return Raw.deserialize(ipcRenderer.sendSync('getTaskList', date), { terse: true })
  } catch(error) {
    log.error('deserialize failure.')
    log.error('date: ' + date)
    log.error(error)
  }
}

/**
 * get task count.
 *
 * @param  {State} taskList
 * @return {Number}
 */

export const getTaskCount = (taskList) => {
  let task = 0
  taskList.document.nodes.map((block) => {
    if (isNotDoneTask(block)) task++
  })
  return task
}

/**
 * get done task count.
 *
 * @param  {State} taskList
 * @return {Number}
 */

export const getDoneTaskCount = (taskList) => {
  let taskDone = 0
  taskList.document.nodes.map((block) => {
    if (isDoneTask(block)) taskDone++
  })
  return taskDone
}

/**
 * get task which is displayed in time line.
 *
 * @param  {Slate} taskList
 * @return {Array}  Blocks in Array
 */

export const getShowInTimelineTasks = (taskList) => {
  let showInTimelineTasks = []
  let breaker = false
  taskList.document.nodes.map((block, i) => {
    if (block.type == "separator") breaker = true;
    if (breaker) return
    if (Constants.showInTimeline.indexOf(block.type) >= 0 && block.text != "") showInTimelineTasks.push(block)
  })
  return showInTimelineTasks
}

/**
 * get task count which show in time line.
 *
 * @param  {State} taskList
 * @return {Number}
 */

export const getShowInTimelineTaskCount = (taskList) => {
  let taskCount = 0
  let breaker = false
  taskList.document.nodes.map((block) => {
    if (block.type == "separator") breaker = true
    if (breaker) return
    if (Constants.showInTimeline.includes(block.type) >= 0 && block.text != "") taskCount++
  })
  return taskCount
}

/**
 * get taskList without done task.
 * @param  {State} taskList target taskList
 * @return {State}          taskList without done task
 */

export const getTaskListWithoutDoneTask = (taskList) => {
  let transform = taskList.transform()
  taskList.document.nodes.map((block) => {
    if (isDoneTask(block) || isSeparator(block)) {
      transform = transform.removeNodeByKey(block.key)
    }
  })
  let taskListWithoutDoneTask = transform.apply()
  if (taskListWithoutDoneTask.document.nodes.size != 0) {
    return taskListWithoutDoneTask
  } else {
    return Raw.deserialize(initialData, { terse: true })
  }
}

/**
 * get taskList only done task.
 * @param  {State} taskList target taskList
 * @return {State}
 */

export const getTaskListOnlyDoneTask = (taskList) => {
  let transform = taskList.transform()
  taskList.document.nodes.map((block) => {
    if (! isDoneTask(block)) {
      transform = transform.removeNodeByKey(block.key)
    }
  })
  let taskListWithoutDoneTask = transform.apply()
  if (taskListWithoutDoneTask.document.nodes.size != 0) {
    return taskListWithoutDoneTask
  } else {
    return Raw.deserialize(initialData, { terse: true })
  }
}

/**
 * get taskList removed blank line.
 * @param  {State} taskList
 * @return {State}
 */

export const getTaskListRemovedBlankLine = (taskList) => {
  let transform = taskList.transform()
  taskList.document.nodes.forEach((block) => {
    if (block.type == 'paragraph' && block.text == '') {
      transform = transform.removeNodeByKey(block.key)
    }
  })
  return transform.apply()
}

/**
 * update current task flag.
 *
 * @param  {State} taskList
 * @return {State}
 */

export const updateCurrentFlag = (taskList) => {
  let transform = taskList.transform()
  taskList.document.nodes.forEach((targetBlock) => {

    let insertBlock = Block.create({
      data: targetBlock.data.set('isCurrent', taskEditorUtil.isCurrentTask(targetBlock)),
      isVoid: targetBlock.isVoid,
      key: targetBlock.key,
      nodes: targetBlock.nodes,
      type: targetBlock.type
    })

    transform = transform
      .removeNodeByKey(targetBlock.key)
      .insertNodeByKey(
        taskList.document.key,
        taskList.document.nodes.indexOf(targetBlock),
        insertBlock
      )
  })
  return transform.apply()
}
