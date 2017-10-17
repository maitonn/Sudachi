import log from 'electron-log';
import firebase from 'firebase';
import 'firebase/firestore';

const auth = firebase.auth();
const db = firebase.firestore();
const usersCollection = db.collection('users')

export const signInWithEmailAndPassword = (email, password) => {
  return auth.signInWithEmailAndPassword(email, password)
    .catch(
      (error) => {
        if(error != null) {
          alert(error.message);
          log.error(error);
        }
      }
    );
}

export const createUser = (email, password, displayName) => {
  return auth.createUserWithEmailAndPassword(email, password)
    .then(
      (user) => {
        return activateUser(user, displayName);
      },
      (error) => {
        throw {
          type: "createUserWithEmailAndPassword",
          message: error.message
        }
      }
    );
}

export const activateUser = (user, displayName) => {
  return user.updateProfile({ displayName: displayName })
    .then(
      () => { return usersCollection.doc(user.uid).set({ displayName: displayName }) }
    );
}
