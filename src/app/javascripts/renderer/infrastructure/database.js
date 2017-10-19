import log from 'electron-log';
import firebase from 'firebase';
import 'firebase/firestore';

const db = firebase.firestore();
const usersCollection = db.collection('users');
const initialData = require("../../../data/initial.json");

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
 * @return {Promise}
 */

export const setDailyDoc = (uid, date, content) => {
  return getDailyDocsCollection(uid).doc(date).set({
      content: content,
      date: date
    })
    .then(
      () => {
        log.info('SAVE DAILYDOC TO FIRESTORE, ID: ', date);
        return { content: content };
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
 * @return {Promise}      
 */

export const getDailyDoc = (uid, date) => {
  return getDailyDocsCollection(uid).doc(date).get()
    .then(
      (doc) => {
        if (doc.exists) {
          log.info('RETRIEVE DAILYDOC FROM FIRESTORE, ID: ', date);
          return { content: doc.data().content };
        } else {
          log.info('NO SUCH DOCUMENT, CREATE DOC: ', date);
          setDailyDoc(uid, date, JSON.stringify(initialData))
            .then(
              (res) => {
                return { content: res.content };
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
