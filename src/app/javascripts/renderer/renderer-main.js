
const firebaseApp = require("./infrastructure/firebase-app");

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
  firebaseApp.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      loadRootContent('main');
    } else {
      // No user is signed in.
      loadRootContent('login');
    }
  });
})();
