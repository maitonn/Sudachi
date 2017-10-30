require('dotenv').config();
// Initialize Firebase
var config = {
  apiKey:            process.env.API_KEY,
  authDomain:        process.env.AUTH_DOMAIN,
  databaseURL:       process.env.DATABASE_URL,
  projectId:         process.env.PROJECT_ID,
  storageBucket:     process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID
};
const firebaseApp = require("firebase");
firebaseApp.initializeApp(config);

module.exports = firebaseApp;
