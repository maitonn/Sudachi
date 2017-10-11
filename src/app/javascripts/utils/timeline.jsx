import * as Constants from '../renderer/components/constants';
import { Block} from 'slate';

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

  if (targetBlock.data.get("positionTop") == positionTop) return taskList

  let insertBlock = Block.create({
    data: targetBlock.data.set("positionTop", positionTop),
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
    data: targetBlock.data.set("requiredTime", requiredTime),
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
