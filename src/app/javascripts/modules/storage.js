import { Raw } from 'slate';

const log = require('electron-log');
const storage = require('electron-storage');
const prevTaskListFilePath = 'prevTaskList/prev.json';
const prevTaskListFilePathByDisplayName = (displayName) => { return 'prevTaskList/' + displayName.replace(/\s+/g, '') + '/prev.json' }

/**
 * check local file exists or not
 *
 * @param  {String}  path file path
 * @return {Promise}
 */
const isPathExists = (path) => {
  return storage.isPathExists(path)
    .then(
      (itDoes) => {
        if (! itDoes) {
          throw {
            type: 'PathNotExistsError',
            message: 'path not exists, path: ' + path
          }
        }
      }
    )
}

/**
 * get local taskList
 *
 * @param  {String} path file path
 * @return {Promise}      if resolve containing taskList
 */
export const getTaskList = (path) => {
  return storage.get(path)
    .then(
      (data) => {
        let taskList = Raw.deserialize(data, { terse: true });
        return { taskList: taskList }
      },
      (error) => {
        log.error(error.message)
        throw new Error(error.message)
      }
    )
}

/**
 * remove local taskList
 *
 * @param  {String} path file path
 * @return {Promise}
 */
const removeTaskList = (path) => {
  return storage.remove(path)
    .then(
      (error) => {
        if(error) {
          log.error(error.message)
        } else {
          log.info('remove file: ', path)
        }
      }
    )
}

/**
 * store taskList data to local storage for the next app started.
 * Expected to be called this function when app reloaded or close app window.
 *
 * @param  {String} displayName
 * @param  {String} date     YYYYMMDD
 * @param  {State} taskList
 */
export const storePrevTaskList = (displayName, date, taskList) => {
  let taskListObject = Raw.serialize(taskList).document
  taskListObject.data.date = date
  storage.set(prevTaskListFilePathByDisplayName(displayName), taskListObject, (error) => {
    if(error) {
      log.error(error)
    }
  })
}

/**
 * get prev taskList by displayName from local storage.
 *
 * @param  {String} displayName
 * @return {Promise}
 */
export const getPrevTaskList = (displayName) => {
  return isPathExists(prevTaskListFilePathByDisplayName(displayName))
    .then(
      () => {
        return getTaskList(prevTaskListFilePathByDisplayName(displayName))
      }
    )
    .catch(
      (error) => {
        if(error.type == 'PathNotExistsError') {
          // TODO Be called by v0.2.1. It will be unuse from v0.2.2.
          return isPathExists(prevTaskListFilePath)
            .then(
              () => { return getTaskList(prevTaskListFilePath) }
            )
        }
        log.error(error.message)
        throw error
      }
    )
}

/**
 * remove prev taskList from local storage.
 *
 * @param {String}
 * @return {Promise}
 */
export const removePrevTaskListByDisplayName = (displayName) => {
  return isPathExists(prevTaskListFilePathByDisplayName(displayName))
    .then(
      () => {
        return removeTaskList(prevTaskListFilePathByDisplayName(displayName))
      }
    )
    .catch(
      (error) => {
        log.error(error.message)
        throw error
      }
    )
}

/**
 * remove prev taskList from local storage.
 * TODO Be called by v0.2.1. It will be unuse from v0.2.2.
 *
 * @return {Promise}
 */
export const removePrevTaskList = () => {
  return isPathExists(prevTaskListFilePath)
    .then(
      () => { return removeTaskList(prevTaskListFilePath) }
    )
    .catch(
      (error) => {
        log.error(error.message)
        throw error
      }
    )
}
