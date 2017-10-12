// Initialize Firebase
const config = {
};
firebase.initializeApp(config);

const signUpBtn = document.getElementById('sign-up');
const signInBtn = document.getElementById('sign-in');
// const signInWithGoogleBtn = document.getElementById('sign-in-with-google');

// Sigin in/up with email
signUpBtn.addEventListener('click', function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(){
    alert('User created successfully.')
  }).catch(function(error){
    if(error != null) {
      console.log(error);
      alert(error.message);
      return;
    }
  });
});

signInBtn.addEventListener('click', function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(email, password).then(function(){
    (() => {
      require('babel-register')(
        {plugins: 'transform-react-jsx'}
      );
      const React = require('react');
      const ReactDOM = require('react-dom');
      const MainContent = require('./components/main');
      const root = document.getElementById('root');
      ReactDOM.render(React.createElement(MainContent), root);
    })();
  }).catch(function(error){
    if(error != null) {
      console.log(error);
      alert(error.message);
      return;
    }
  });
});

// Sign in with google account.
// const provider = new firebase.auth.GoogleAuthProvider();
// provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
// signInWithGoogleBtn.addEventListener('click', function() {
//   firebase.auth().signInWithPopup(provider).then(function(result){
//     const token = result.credential.accessToken;
//     const user = result.user;
//     alert('Sign in with google successfuly');
//     return;
//   }).catch(function(error){
//     console.log(error);
//     alert(error.message);
//     return
//   });
// });
