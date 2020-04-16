import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

// Modify this list as needed
const EXPECTED_VARS = [
  'REACT_APP_API_KEY',
  'REACT_APP_AUTH_DOMAIN',
  'REACT_APP_DATABASE_URL',
  'REACT_APP_PROJECT_ID',
  'REACT_APP_STORAGE_BUCKET',
  'REACT_APP_MESSAGING_SENDER_ID',
  'REACT_APP_APP_ID'
];

for (const v of EXPECTED_VARS) {
  if (process.env[v] === undefined) {
    console.warn("Missing the expected env var " + v);
  }
}

const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

class Firebase {
  constructor() {
    app.initializeApp(config);

    this.emailAuthProvider = app.auth.EmailAuthProvider;
    this.auth = app.auth();
    this.db = app.database();

    this.googleProvider = new app.auth.GoogleAuthProvider();
  }

  // Auth API

  createUserWithEmailAndPassword = (email, password) =>
    this.auth.createUserWithEmailAndPassword(email, password);

  signInWithEmailAndPassword = (email, password) =>
    this.auth.signInWithEmailAndPassword(email, password);

  signInWithGoogle = () =>
    this.auth.signInWithPopup(this.googleProvider);

  signOut = () => this.auth.signOut();

  resetPassword = email => this.auth.sendPasswordResetEmail(email);

  updatePassword = newPassword =>
    this.auth.currentUser.updatePassword(newPassword);

  sendEmailVerification = () =>
    this.auth.currentUser.sendEmailVerification({
      url: process.env.REACT_APP_CONFIRMATION_EMAIL_REDIRECT
    });

  // Merge auth and DB user API
  onAuthUserListener = (next, fallback) =>
    this.auth.onAuthStateChanged(authUser => {
      if (authUser) {
        this.user(authUser.uid)
          .once('value')
          .then(snapshot => {
            const dbUser = snapshot.val();

            if (!dbUser.roles) {
              dbUser.roles = {};
            }

            authUser = {
              uid: authUser.uid,
              email: authUser.email,
              emailVerified: authUser.emailVerified,
              providerData: authUser.providerData,
              ...dbUser,
            };
            next(authUser);
          });
      } else {
        fallback();
      }
    });

  // User API

  user = uid => this.db.ref(`users/${uid}`);

  users = () => this.db.ref('users');
}

export default Firebase;
