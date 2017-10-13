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

const loadRootContent = (content) => {
  require('babel-register')(
    { plugins: 'transform-react-jsx' }
  );
  const React = require('react');
  const ReactDOM = require('react-dom');
  const root = document.getElementById('root');
  const rootContent = require('./components/' + content)
  ReactDOM.render(React.createElement(rootContent), root);
}

(() => {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      loadRootContent('main');
    } else {
      // No user is signed in.
      loadRootContent('login');
    }
  });
})();
