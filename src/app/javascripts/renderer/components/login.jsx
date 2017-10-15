import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase';
import 'firebase/firestore';
import log from 'electron-log';
const db = firebase.firestore();

const loginForm = class LoginForm extends React.Component {

  onClickSignIn() {
    const email = document.getElementById('sign-in-email').value;
    const password = document.getElementById('sign-in-password').value;
    firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
      const MainContent = require('./main');
      const root = document.getElementById('root');
      ReactDOM.render(React.createElement(MainContent), root);
    }).catch(function(error) {
      if(error != null) {
        log.error(error);
        alert(error.message);
        return;
      }
    });
  }

  onClickSignUp() {
    const email = document.getElementById('email').value;
    const displayName = document.getElementById('first-name').value + ' ' + document.getElementById('last-name').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    if (password != passwordConfirm) {
      alert('Password does not match. Please confirm your password.');
      return;
    }
    // create user with email.
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function(){
      const user = firebase.auth().currentUser;
      // after created user, update user's profile.
      user.updateProfile({
        displayName: displayName
      })
      .then(function(){
        // after updated user's profile, add document to users collection.
        db.collection('users').doc(user.uid).set({
          displayName: displayName
        })
        .then(function(docRef) {
          // after added document, load editor content.
          const MainContent = require('./main');
          const root = document.getElementById('root');
          ReactDOM.render(React.createElement(MainContent), root);
        })
        .catch(function(error) {
          log.error("Error adding document: ", error)
        });
      })
      .catch(function(error){
        log.error(error);
      });
    })
    .catch(function(error){
      if(error != null) {
        log.error(error);
        alert(error.message);
        return;
      }
    });
  }

  render() {
    return (
      <div id="login">
        <img className="sudachi-logo" src="../images/sudachi.png" alt="sudachi-logo"/>
        <span>{'Sign in to Sudachi'}</span>
        <section id="sign-in-by-email">
          <div className="form-group">
            <input type="email" placeholder="email" className="form-control" id="sign-in-email"/>
          </div>
          <div className="form-group">
            <input type="password" placeholder="password" className="form-control" id="sign-in-password"/>
          </div>
          <div className="button-group">
            <button type="submit" className="btn btn-primary" id="sign-in" onClick={this.onClickSignIn.bind(this)}>{'Sign in'}</button>
          </div>
        </section>
        <p className="separator">{'- or -'}</p>
        <section id="sign-up-by-email">
          <div className="form-group">
            <input type="email" placeholder="email" className="form-control" id="email"/>
          </div>
          <form className="form-inline">
            <div className="form-group">
              <input type="text" placeholder="first name" className="form-control" id="first-name"/>
            </div>
            <div className="form-group">
              <input type="text" placeholder="last name" className="form-control" id="last-name"/>
            </div>
          </form>
          <div className="form-group">
            <input type="password" placeholder="password" className="form-control" id="password"/>
          </div>
          <div className="form-group">
            <input type="password" placeholder="password(confirm)" className="form-control" id="password-confirm"/>
          </div>
          <div className="button-group">
            <button type="submit" className="btn btn-default" id="sign-up" onClick={this.onClickSignUp.bind(this)}>{'Create New Account'}</button>
          </div>
        </section>
      </div>
    );
  }
}

module.exports = loginForm;
