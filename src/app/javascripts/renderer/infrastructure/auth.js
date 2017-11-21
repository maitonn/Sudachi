import log from 'electron-log';
import firebaseApp from './firebase-app';
import AppFirestore from './database';
const auth = firebaseApp.auth();
const shouldEnablePersistence = false
const database = new AppFirestore(shouldEnablePersistence)

/**
 * sign in with email and password.
 * @param  {String} email
 * @param  {String} password
 * @return {Promise}
 */
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

/**
 * sign out.
 * @return {Promise}
 */
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

/**
 * create and activate user with email and password.
 * cf. firebase user object: https://firebase.google.com/docs/reference/js/firebase.User
 * @param  {String} email
 * @param  {String} password
 * @param  {String} displayName
 * @return {Promise} containing user object and displayName if success to create user.
 */
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

/**
 * activate user. create user document in firestore
 * @param  {User} user        firebase user object
 * @param  {String} displayName
 * @return {Promise}
 */
export const activateUser = (user, displayName) => {
  return user.updateProfile({ displayName: displayName })
    .then(
      () => { return database.createUserDoc(user.uid, displayName) }
    );
}

/**
 * get current user.
 * @return {User} firebase user object
 */
export const getCurrentUser = () => {
  return firebaseApp.auth().currentUser;
}
