import log from 'electron-log';
import firebaseApp from './firebase-app';
import * as database from './database';
const auth = firebaseApp.auth();

export const signInWithEmailAndPassword = (email, password) => {
  return auth.signInWithEmailAndPassword(email, password)
    .catch(
      (error) => {
        throw {
          type: "signInWithEmailAndPassword",
          message: error.message
        }
      }
    );
}

export const signOut = () => {
  return auth.signOut()
    .catch(
      (error) => {
        log.error(error.message);
        throw {
          type: 'signOut',
          message: error.message
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
          type: 'createUserWithEmailAndPassword',
          message: error.message
        }
      }
    );
}

export const activateUser = (user, displayName) => {
  return user.updateProfile({ displayName: displayName })
    .then(
      () => { return database.createUserDoc(user.uid, displayName) }
    );
}

export const getCurrentUser = () => {
  return firebaseApp.auth().currentUser;
}
