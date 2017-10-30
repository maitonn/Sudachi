import _ from 'lodash';
import moment from 'moment';
import * as database from '../renderer/infrastructure/database'
import * as taskListStorage from './storage'

const log = require('electron-log');
const storage = require('electron-storage');
const migrateTo = 30;
const getTaskListPath = (date) => { return 'taskList/' + date + '.json' }

/**
 * get migrate target date list.
 *
 * @return {array} [YYYYMMDD]
 */
const getMigrateDateList = () => {
  let migrateDateList = []
  _.each(_.range(0, migrateTo), (d, i) => {
    migrateDateList.push(moment().add(-d, 'd').format("YYYYMMDD"))
  })
  return migrateDateList
}

/**
 * check taskList path exists or not
 *
 * @param  {String}  date YYYYMMDD
 * @return {Promise}
 */
const isTaskListPathExists = (date) => {
  return storage.isPathExists(getTaskListPath(date))
    .then(
      (itDoes) => {
        if(! itDoes) {
          throw new Error('local file to be migrated not found, date: ' + date)
        }
      }
    )
}

/**
 * get migrate taskList
 *
 * @param  {String} date YYYYMMDD
 * @return {Promise}      if resolve containing taskList
 */
const getMigratieTaskList = (date) => {
  return isTaskListPathExists(date)
    .then(
      () => {
        return taskListStorage.getTaskList(getTaskListPath(date))
      }
    )
}

/**
 * load taskList and store to firestore
 *
 * @param  {String} uid
 * @return {Promise}
 */
const loadAndMigrate = (uid) => {
  _.each(getMigrateDateList(), (date, i) => {
    getMigratieTaskList(date)
      .then(
        (res) => {
          log.info('local taskList exists, date: ', date)
          database.storeTaskList(uid, date, res.taskList)
        }
      )
      .catch(
        (error) => {
          log.error(error.message)
        }
      )
  })
}

/**
 * migrate local taskList data to firestore.
 *
 * @param  {String} uid
 * @return {Promise}
 */
export const migrate = (uid) => {
  return database.fetchUserInfo(uid)
    .then(
      (res) => {
        if(res.user.isMigrated) {
          log.info('migration is already completed.')
        } else {
          loadAndMigrate(uid)
          database.updateUserMigrated(uid)
        }
      }
    )
    .catch(
      (error) => {
        log.error(error.message)
      }
    )
}
