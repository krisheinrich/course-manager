import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import { SignUpLink } from '../SignUp';
import { PasswordForgetLink } from '../PasswordForget';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';


const ERROR_CODE_ACCOUNT_EXISTS =
  'auth/account-exists-with-different-credential';

const ERROR_MSG_ACCOUNT_EXISTS = `
  An account with an email address to
  this social account already exists. Try to login from
  this account instead and associate your social accounts on
  your personal account page.
`;

const SignInPage = () => (
  <div>
    <h1>Sign In</h1>
    <SignInForm />
    <SignInGoogle />
    <PasswordForgetLink />
    <SignUpLink />
  </div>
);

const INITIAL_STATE = {
  email: '',
  password: '',
  error: null
};

class _SignInForm extends Component {
  constructor(props) {
    super(props);

    this.state = { ...INITIAL_STATE };
  }

  onSubmit = e => {
    e.preventDefault();

    const { email, password } = this.state;

    this.props.firebase
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        this.setState({ ...INITIAL_STATE });
        this.props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        this.setState({ error });
      });
  };

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const { email, password, error } = this.state;

    const isInvalid = password === '' || email === '';

    return (
      <form onSubmit={this.onSubmit}>
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
        <button disabled={isInvalid} type="submit">
          Sign In
        </button>

        { error && <p>{ error.message }</p> }
      </form>
    );
  }
}

class _SignInGoogle extends Component {
  constructor(props) {
    super(props);

    this.state = { error: null };
  }

  onSubmit = e => {
    e.preventDefault();

    this.props.firebase
      .signInWithGoogle()
      .then(socialAuthUser => {
        // Create a user in realtime db too
        return this.props.firebase
          .user(socialAuthUser.user.uid)
          .set({
            username: socialAuthUser.user.displayName,
            email: socialAuthUser.user.email,
            roles: {}
          });
      })
      .then(() => {
        this.setState({ error: null });
        this.props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
          error.message = ERROR_MSG_ACCOUNT_EXISTS;
        }
        this.setState({ error });
      });
  };

  render() {
    const { error } = this.state;
    return (
      <form onSubmit={this.onSubmit}>
        <button type="submit">Sign In with Google</button>
        { error && <p>{ error.message }</p> }
      </form>
    );
  }
}

const SignInForm = compose(
  withRouter,
  withFirebase,
)(_SignInForm);

const SignInGoogle = compose(
  withRouter,
  withFirebase,
)(_SignInGoogle);

export default SignInPage;

export { SignInForm, SignInGoogle };
