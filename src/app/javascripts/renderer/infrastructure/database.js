import log from 'electron-log';
import firebase from 'firebase';
import 'firebase/firestore';

const db = firebase.firestore();
const usersCollection = db.collection('users');

export const createUserDoc = (uid, displayName) => {
  return usersCollection.doc(uid).set({ displayName: displayName })
    .catch(
      (error) => {
        throw new Error(error.message);
      }
    );
}
