import log from 'electron-log';
import firebase from 'firebase';
import 'firebase/firestore';
import { Raw } from 'slate';
import * as taskListUtil from '../../utils/task-list'

const db = firebase.firestore();
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
 * @return {Promise} with state object.
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
