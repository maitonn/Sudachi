import log from 'electron-log';
import firebase from 'firebase';
import 'firebase/firestore';

const db = firebase.firestore();
const usersCollection = db.collection('users');

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
 * @param {String} content
 */

export const setDailyDoc = (uid, date, content) => {
  getDailyDocsCollection(uid).doc(date).set({
      content: content,
      date: date
    })
    .then(
      () => { log.info('SAVE DAILYDOC TO FIRESTORE, ID: ', date) }
    )
    .catch(
      (error) => {
        log.error('ERROR SAVING TO FIRESTORE, ID ', date, error);
      }
    );
}
