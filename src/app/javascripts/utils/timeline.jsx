import * as Constants from '../renderer/components/constants';
import { Block} from 'slate';
import * as taskEditorUtil from './task-editor';
import _ from 'lodash';

/**
 * get task position bottom.
 *
 * @param  {Block} block
 * @param  {requiredTime} requiredTime optional value
 * @return {Number}
 */

export const getPositionBottom = (block, requiredTime) => {
  requiredTime = requiredTime || block.data.get("requiredTime")
  return block.data.get("positionTop") + ((requiredTime / 60) * Constants.heightPerHour)
}

/**
 * caliculated time from position top
 *
 * @param  {Number} positionTop
 * @return {String} hh:mm
 */

export const positionTopToTime = (positionTop) => {
  const heightForMin = positionTop % Constants.heightPerHour
  const hour = (positionTop - heightForMin) / Constants.heightPerHour
  const min = (heightForMin / Constants.heightPerHour) * 60
  return hour.toString() + ':' + ('00' + min.toString()).slice(-2)
}

/**
 * set task positionTop data to state obj.
 *
 * @param {State} taskList
 * @param {String} taskKey
 * @param {Number} positionTop
 * @return {State}
 */

export const setTaskPositionTop = (taskList, taskKey, positionTop) => {
  let targetBlock
  taskList.document.nodes.map((block) => {
    if (block.key == taskKey) targetBlock = block
  })

  if (targetBlock.data.get('positionTop') == positionTop) return taskList

  let insertBlock = Block.create({
    data: targetBlock.data
      .set('positionTop', positionTop)
      .set('isCurrent', taskEditorUtil.isCurrentTask(targetBlock, positionTop)),
    isVoid: targetBlock.isVoid,
    key: targetBlock.key,
    nodes: targetBlock.nodes,
    type: targetBlock.type
  })

  let transform = taskList.transform()
    .removeNodeByKey(taskKey)
    .insertNodeByKey(
      taskList.document.key,
      taskList.document.nodes.indexOf(targetBlock),
      insertBlock
    )

  return transform.apply()
}

/**
 * set task requiredTime data to state obj.
 *
 * @param {State} taskList
 * @param {String} taskKey
 * @param {Number} requiredTime
 * @return {State}
 */

export const setTaskRequiredTime = (taskList, taskKey, requiredTime) => {
  let targetBlock
  taskList.document.nodes.map((block) => {
    if (block.key == taskKey) targetBlock = block
  })

  if (targetBlock.data.get("requiredTime") == requiredTime) return taskList

  let insertBlock = Block.create({
    data: targetBlock.data
      .set("requiredTime", requiredTime)
      .set('isCurrent', taskEditorUtil.isCurrentTask(
        targetBlock,
        targetBlock.data.get('positionTop'),
        requiredTime)
      ),
    isVoid: targetBlock.isVoid,
    key: targetBlock.key,
    nodes: targetBlock.nodes,
    type: targetBlock.type
  })

  let transform = taskList.transform()
    .removeNodeByKey(taskKey)
    .insertNodeByKey(
      taskList.document.key,
      taskList.document.nodes.indexOf(targetBlock),
      insertBlock
    )

  return transform.apply()
}

/**
 * set task width data to state obj.
 *
 * @param {State} taskList
 * @param {String} taskKey
 * @param {Number} width
 * @param {Number} index
 * @return {State}
 */

export const setTaskWidth = (taskList, taskKey, width, index) => {
  let taskBlock
  taskList.document.nodes.map((block) => {
    if (block.key == taskKey) taskBlock = block
  })

  if (taskBlock.data.get("width", 0) == width) return taskList

  let resizedBlock = Block.create({
    data: taskBlock.data.set("width", width).set("marginLeft", width * index),
    isVoid: taskBlock.isVoid,
    key: taskBlock.key,
    nodes: taskBlock.nodes,
    type: taskBlock.type
  })

  let transform = taskList.transform()
    .removeNodeByKey(taskKey)
    .insertNodeByKey(
      taskList.document.key,
      taskList.document.nodes.indexOf(taskBlock),
      resizedBlock
    )

  return transform.apply()
}

/**
 * get task position range objects
 *
 * @param  {Array} displayTasks Block in Array
 * @return {objects}  key: Block key, value: [top, bottom]
 */

export const getTaskPositionRanges = (displayTasks) => {
  let taskPositionRange = {}
  _.each(displayTasks, (block, i) => {
    taskPositionRange[block.key] = [
      block.data.get("positionTop"),
      getPositionBottom(block)
    ]
  })
  return taskPositionRange
}
