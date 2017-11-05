import * as Constants from '../renderer/components/constants'

/**
 * get next Indent for list item or check list item.
 *
 * @param  {Number}  prevIndent prev Indent
 * @param  {Boolean} isShift    with shift or not
 * @return {Number}             next Indent
 */

export const getIndent = (prevIndent, isShift) => {
  let nextIndent = prevIndent || Constants.minIndent
  if (prevIndent < Constants.maxIndent && ! isShift) nextIndent++
  if (prevIndent > Constants.minIndent && isShift) nextIndent--
  return nextIndent
}

 /**
  * check whether current task or not.
  *
  * @param  {Block}  node
  * @param  {Number}  nextPositionTop option
  * @param  {Number}  nextRequiredTime option
  * @return {Boolean}
  */

export const isCurrentTask = (node, nextPositionTop, nextRequiredTime) => {
  const top = nextPositionTop || node.data.get("positionTop")
  const requiredTime = nextRequiredTime || node.data.get("requiredTime")
  const buttom = top + (Constants.heightPerHour * requiredTime / 60)
  const markerPositionTop = Constants.markerPositionTop()
  return markerPositionTop >= top && markerPositionTop < buttom
}

 /**
  * check whether focus block or not.
  * @param  {String}  nodeKey  target block key
  * @param  {String}  focusKey focused block key
  * @return {Boolean}
  */

export const isFocusedTask = (nodeKey, focusKey) => {
  return parseInt(nodeKey) - 1 == parseInt(focusKey)
}
