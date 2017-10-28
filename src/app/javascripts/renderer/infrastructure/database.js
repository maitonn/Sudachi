import log from 'electron-log';
import firebaseApp from './firebase-app';
import 'firebase/firestore';
import { Raw } from 'slate';
import * as taskListUtil from '../../utils/task-list'

const db = firebaseApp.firestore();
const usersCollection = db.collection('users');
const serializedInitialData = require("../../../data/initial.json");
const initialTaskList = Raw.deserialize(serializedInitialData, { terse: true });

/**
 * create user doc to firestore.
 * @param  {String} uid
 * @param  {String} displayName
 * @return {Promise}
 */

export const createUserDoc = (uid, displayName) => {
  return usersCollection.doc(uid).set({ displayName: displayName })
    .catch(
      (error) => {
        throw new Error(error.message);
      }
    );
}

export const fetchUserInfo = (uid) => {
  return usersCollection.doc(uid).get()
    .then(
      (doc) => {
        log.info('FETCH USER INFO, DISPLAY NAME: ', doc.data().displayName)
        return { user: doc.data() }
      }
    )
    .catch(
      (error) => {
        throw new Error(error.message)
      }
    )
}

/**
 * update migrated status true.
 *
 * @param  {String} uid
 * @return {Promise}
 */

export const updateUserMigrated = (uid) => {
  return usersCollection.doc(uid).set({ isMigrated: true }, { merge: true })
    .catch(
      (error) => {
        throw new Error(error.message)
      }
    )
}

/**
 * get dailydoc collection by uid.
 * @param  {String} uid
 * @return {Object}     firestore collection
 */

export const getDailyDocsCollection = (uid) => {
  return usersCollection.doc(uid).collection('dailyDocs');
}

/**
 * save dailydoc to firestore.
 * @param {String} uid
 * @param {String} date    YYYYMMDD
 * @param {State} taskList
 * @return {Promise}
 */

export const storeTaskList = (uid, date, taskList) => {
  return getDailyDocsCollection(uid).doc(date).set({
      content: taskListUtil.stringifyTaskList(taskList),
      date: date
    })
    .then(
      () => {
        log.info('SAVE DAILYDOC TO FIRESTORE, ID: ', date);
        return { taskList: taskList };
      }
    )
    .catch(
      (error) => {
        log.error('ERROR SAVING DAILYDOC TO FIRESTORE, ID: ', date, error);
        throw new Error(error.message);
      }
    );
}

/**
 * get dailydoc from firestore.
 * @param  {String} uid
 * @param  {String} date
 * @return {Promise} containing state object.
 */

export const fetchTaskList = (uid, date) => {
  return getDailyDocsCollection(uid).doc(date).get()
    .then(
      (doc) => {
        if (doc.exists) {
          log.info('RETRIEVE FROM FIRESTORE, DOC ID: ', date);
          return { taskList: taskListUtil.parseStringTaskList(doc.data().content) };
        } else {
          log.info('NO SUCH DOCUMENT, CREATE DOC: ', date);
          storeTaskList(uid, date, initialTaskList)
            .then(
              (res) => {
                return { taskList: res.taskList };
              }
            );
        }
      }
    )
    .catch(
      (error) => {
        log.error('ERROR RETRIEVING DAILYDOC FROM FIRESTORE, ID:', date, error);
        throw new Error(error.message);
      }
    )
}

/**
 * get dailydoc from firestore by date range
 * @param  {String} uid
 * @param  {String} dateFrom YYYYMMDD
 * @param  {String} dateTo   YYYYMMDD
 * @return {Promise} containing array of state object
 */

export const fetchTaskListByDateRange = (uid, dateFrom, dateTo = dateFrom) => {
  return getDailyDocsCollection(uid)
    .where('date', '>=', dateFrom)
    .where('date', '<=', dateTo)
    .limit(30)
    .orderBy('date')
    .get()
    .then(
      (querySnapshot) => {
        let taskLists = [];
        querySnapshot.forEach((doc) => {
          log.info('RETRIEVE FROM FIRESTORE, DOC ID: ', doc.id);
          taskLists.push({
            date: doc.data().date,
            taskList: taskListUtil.parseStringTaskList(doc.data().content)
          })
        });
        return { taskLists: taskLists }
      }
    )
    .catch(
      (error) => {
        log.error('ERROR RETRIEVING FROM FIRESTORE, FROM ', dateFrom, 'TO ', dateTo);
        throw new Error(error.message);
      }
    );
}
