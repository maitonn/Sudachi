import log from 'electron-log';
import firebaseApp from './firebase-app';
import 'firebase/firestore';
import { Raw } from 'slate';
import * as taskListUtil from '../../utils/task-list'

const serializedInitialData = require("../../../data/initial.json");
const initialTaskList = Raw.deserialize(serializedInitialData, { terse: true });

const AppFirestore = class AppFirestore {

  constructor(shouldEnablePersistence){
    this.firestore = firebaseApp.firestore()
    this.persistenceEnabled = shouldEnablePersistence ?
      this.firestore.enablePersistence().then(() => true) :
      new Promise((res, rej) => { res(false); })
  }

  /**
   * get users collection.
   *
   * @return {Object} firebase collection of users
   */

  getUsersCollection(){
    return this.firestore.collection('users');
  }

  /**
   * get dailydoc collection by uid.
   *
   * @param  {String} uid
   * @return {Object}     firestore collection of dailyDocs
   */

  getDailyDocsCollection(uid){
    return this.getUsersCollection().doc(uid).collection('dailyDocs');
  }

  /**
   * create user doc to firestore.
   *
   * @param  {String} uid
   * @param  {String} displayName
   * @return {Promise}
   */

  createUserDoc(uid, displayName){
    return this.getUsersCollection().doc(uid).set({ displayName: displayName })
      .catch(
        (error) => {
          throw new Error(error.message);
        }
      );
  }

  /**
   * fetch user info by uid
   *
   * @param  {String} uid
   * @return {Promise}
   */

  fetchUserInfo(uid){
    return this.getUsersCollection().doc(uid).get()
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
   * save dailydoc to firestore.
   *
   * @param {String} uid
   * @param {String} date    YYYYMMDD
   * @param {State} taskList
   * @return {Promise}
   */

  storeTaskList(uid, date, taskList){
    return this.getDailyDocsCollection(uid).doc(date).set({
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
   *
   * @param  {String} uid
   * @param  {String} date
   * @return {Promise} containing state object.
   */

  fetchTaskList(uid, date){
    return this.getDailyDocsCollection(uid).doc(date).get()
      .then(
        (doc) => {
          if (doc.exists) {
            log.info('RETRIEVE FROM FIRESTORE, DOC ID: ', date);
            return { taskList: taskListUtil.parseStringTaskList(doc.data().content) };
          } else {
            log.info('NO SUCH DOCUMENT, CREATE DOC: ', date);
            return this.storeTaskList(uid, date, initialTaskList)
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
   * get dailydoc from firestore by date range.
   *
   * @param  {String} uid
   * @param  {String} dateFrom YYYYMMDD
   * @param  {String} dateTo   YYYYMMDD
   * @return {Promise} containing array of state object
   */

  fetchTaskListByDateRange(uid, dateFrom, dateTo = dateFrom){
    return this.getDailyDocsCollection(uid)
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
}

module.exports = AppFirestore
