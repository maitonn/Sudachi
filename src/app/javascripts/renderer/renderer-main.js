// Initialize Firebase
var config = {
  apiKey: "AIzaSyB_slMURwrAuf0JvCQCCwZw8SqMdVdHEfA",
  authDomain: "sudachi-47f40.firebaseapp.com",
  databaseURL: "https://sudachi-47f40.firebaseio.com",
  projectId: "sudachi-47f40",
  storageBucket: "sudachi-47f40.appspot.com",
  messagingSenderId: "112036945599"
};
const firebase = require("firebase");
firebase.initializeApp(config);

const loadMainComponet = () => {
  require('babel-register')(
    { plugins: 'transform-react-jsx' }
  );
  const React = require('react');
  const ReactDOM = require('react-dom');
  const MainContent = require('./components/main');
  const root = document.getElementById('root');
  ReactDOM.render(React.createElement(MainContent), root);
}

const signUpBtn = document.getElementById('sign-up');
const signInBtn = document.getElementById('sign-in');

// Sigin in/up with email
signUpBtn.addEventListener('click', function() {
  const email = document.getElementById('email').value;
  const displayName = document.getElementById('first-name').value + ' ' + document.getElementById('last-name').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('password-confirm').value;
  if (password != passwordConfirm) {
    alert('Password does not match. Please confirm your password.');
    return;
  }
  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(){
    alert('User created successfully.')
    const user = firebase.auth().currentUser;
    user.updateProfile({
      displayName: displayName
    }).then(function(){
      alert('User info updated successfully.');
      loadMainComponet();
    }).catch(function(error){
      console.log(error);
    });
  }).catch(function(error){
    if(error != null) {
      console.log(error);
      alert(error.message);
      return;
    }
  });
});

signInBtn.addEventListener('click', function() {
  const email = document.getElementById('sign-in-email').value;
  const password = document.getElementById('sign-in-password').value;
  firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
    const user = firebase.auth().currentUser;
    loadMainComponet();
  }).catch(function(error) {
    if(error != null) {
      console.log(error);
      alert(error.message);
      return;
    }
  });
});
