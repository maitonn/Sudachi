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

(() => {
  require('babel-register')(
    { plugins: 'transform-react-jsx' }
  );
  const React = require('react');
  const ReactDOM = require('react-dom');
  const MainContent = require('./components/login');
  const root = document.getElementById('root');
  ReactDOM.render(React.createElement(MainContent), root);
})();
