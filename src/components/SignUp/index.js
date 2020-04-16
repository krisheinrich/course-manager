import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';


const ERROR_CODE_ACCOUNT_EXISTS = 'auth/email-already-in-use';

const ERROR_MSG_ACCOUNT_EXISTS = `
  An account with this email address already exists.
  Try to login with this account instead. If you think the
  account is already used from one of the social logins, try
  to sign-in with one of them. Afterward, associate your accounts
  on your personal account page.
`;

const SignUpPage = () => (
  <div>
    <h1>SignUp</h1>
    <SignUpForm />
  </div>
);

const INITIAL_STATE = {
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
  isAdmin: false,
  error: null
};

class _SignUpForm extends Component {
  constructor(props) {
    super(props);

    this.state = { ...INITIAL_STATE };
  }

  onSubmit = e => {
    e.preventDefault();

    const { username, email, password, isAdmin } = this.state;

    const roles = {};
    if (isAdmin) {
      roles[ROLES.ADMIN] = ROLES.ADMIN;
    }

    this.props.firebase
      .createUserWithEmailAndPassword(email, password)
      .then(authUser => {
        return this.props.firebase
          .user(authUser.user.uid)
          .set({
            username,
            email,
            roles
          });
      })
      .then(() => {
        return this.props.firebase.sendEmailVerification();
      })
      .then(() => {
        this.setState({ ...INITIAL_STATE });
        this.props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
          error.message = ERROR_MSG_ACCOUNT_EXISTS;
        }
        this.setState({ error });
      });
  }

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  onChangeCheckbox = e => {
    this.setState({ [e.target.name]: e.target.checked });
  };

  render() {
    const {
      username, email, password, passwordConfirm, isAdmin, error
    } = this.state;

    const isInvalid =
      password !== passwordConfirm ||
      password === '' ||
      email === '' ||
      username === '';

    return (
      <form onSubmit={this.onSubmit}>
        <input
          name="username"
          value={username}
          onChange={this.onChange}
          type="text"
          placeholder="Full Name"
        />
        <input
          name="email"
          value={email}
          onChange={this.onChange}
          type="text"
          placeholder="Email Address"
        />
        <input
          name="password"
          value={password}
          onChange={this.onChange}
          type="password"
          placeholder="Password"
        />
        <input
          name="passwordConfirm"
          value={passwordConfirm}
          onChange={this.onChange}
          type="password"
          placeholder="Confirm Password"
        />
        <label>
          Admin:
          <input
            name="isAdmin"
            type="checkbox"
            checked={isAdmin}
            onChange={this.onChangeCheckbox}
          />
        </label>
        <button disabled={isInvalid} type="submit">
          Sign Up
        </button>

        { error && <p>{ error.message }</p> }
      </form>
    );
  }
}

const SignUpLink = () => (
  <p>
    Don't have an account? <Link to={ROUTES.SIGN_UP}>Sign Up</Link>
  </p>
);

const SignUpForm = compose(
  withRouter,
  withFirebase
)(_SignUpForm);

export default SignUpPage;

export { SignUpForm, SignUpLink };
