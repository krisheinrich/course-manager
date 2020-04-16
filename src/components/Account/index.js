import React, { Component } from 'react';
import { compose } from 'recompose';

import {
  AuthUserContext, withAuthorization, withEmailVerification
} from '../Session';
import { withFirebase } from '../Firebase';
import { PasswordForgetForm } from '../PasswordForget';
import PasswordChangeForm from '../PasswordChange';

const SIGN_IN_METHODS = [
  {
    id: 'password',
    provider: null,
  },
  {
    id: 'google.com',
    provider: 'googleProvider',
  }
];

const AccountPage = () => (
  <AuthUserContext.Consumer>
  { authUser => (
    <div>
      <h1>Account: { authUser.email }</h1>
      <PasswordForgetForm />
      <PasswordChangeForm />
      <LoginManagement authUser={authUser} />
    </div>
  ) }
  </AuthUserContext.Consumer>
);

class _LoginManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeSignInMethods: [],
      loading: false,
      error: null
    };
  }

  componentDidMount() {
    this.fetchSignInMethods();
  }

  fetchSignInMethods = () => {
    this.setState({ loading: true });
    this.props.firebase.auth
      .fetchSignInMethodsForEmail(this.props.authUser.email)
      .then(activeSignInMethods =>
        this.setState({ activeSignInMethods, loading: false, error: null }))
      .catch(error => this.setState({ loading: false, error }));
  };

  onDefaultLoginLink = password => {
    const credential = this.props.firebase.emailAuthProvider.credential(
      this.props.authUser.email,
      password
    );

    this.props.firebase.auth.currentUser
      .linkWithCredential(credential)
      .then(this.fetchSignInMethods)
      .catch(error => this.setState({ error }));
  };

  onSocialLoginLink = provider => {
    this.props.firebase.auth.currentUser
      .linkWithPopup(this.props.firebase[provider])
      .then(this.fetchSignInMethods)
      .catch(error => this.setState({ error }));
  };

  onUnlink = providerId => {
    this.props.firebase.auth.currentUser
      .unlink(providerId)
      .then(this.fetchSignInMethods)
      .catch(error => this.setState({ error }));
  };

  render() {
    const { activeSignInMethods, loading, error } = this.state;

    return (
      <div>
        Sign In Methods:
        <ul>
          { SIGN_IN_METHODS.map(signInMethod => {
            const onlyOneLeft = activeSignInMethods.length === 1;
            const isEnabled = activeSignInMethods.includes(signInMethod.id);
            return (
              <li key={signInMethod.id}>
              { signInMethod.id === 'password' ? (
                <DefaultLoginToggle
                  onlyOneLeft={onlyOneLeft}
                  isLoading={loading}
                  isEnabled={isEnabled}
                  signInMethod={signInMethod}
                  onLink={this.onDefaultLoginLink}
                  onUnlink={this.onUnlink}
                />
              ) : (
                <SocialLoginToggle
                  onlyOneLeft={onlyOneLeft}
                  isLoading={loading}
                  isEnabled={isEnabled}
                  signInMethod={signInMethod}
                  onLink={this.onSocialLoginLink}
                  onUnlink={this.onUnlink}
                />
              ) }
              </li>
            );
          }) }
        </ul>
        { error && error.message }
      </div>
    );
  }
}

const SocialLoginToggle = ({
  onlyOneLeft,
  isEnabled,
  isLoading,
  signInMethod,
  onLink,
  onUnlink
}) => (
  isLoading
  ? <div>Loading...</div>
  : <>
    <div>
      { signInMethod.id } - { isEnabled ? 'Enabled' : 'Disabled' }
    </div>
    { isEnabled ? (
      <button type="button"
        onClick={() => onUnlink(signInMethod.id)}
        disabled={onlyOneLeft}
      >
        Deactivate {signInMethod.id}
      </button>
    ) : (
      <button type="button" onClick={() => onLink(signInMethod.provider)}>
        Link {signInMethod.id}
      </button>
    ) }
  </>
);

class DefaultLoginToggle extends Component {
  constructor(props) {
    super(props);
    this.state = { password: '', passwordConfirm: '' };
  }

  onSubmit = e => {
    e.preventDefault();
    this.props.onLink(this.state.password);
    this.setState({ password: '', passwordConfirm: '' });
  };

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const { onlyOneLeft, isEnabled, isLoading, signInMethod, onUnlink } = this.props;
    const { password, passwordConfirm } = this.state;
    const isInvalid = password !== passwordConfirm || password === '';

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <>
        <div>
          { signInMethod.id } - { isEnabled ? 'Enabled' : 'Disabled' }
        </div>
        { isEnabled ? (
          <button type="button"
            onClick={() => onUnlink(signInMethod.id)}
            disabled={onlyOneLeft}
          >
            Deactivate
          </button>
        ) : (
          <form onSubmit={this.onSubmit}>
            <input name="password" value={password} onChange={this.onChange}
              type="password" placeholder="New Password"
            />
            <input name="passwordConfirm" value={passwordConfirm} onChange={this.onChange}
              type="password" placeholder="Confirm New Password"
            />
            <button disabled={isInvalid} type="submit">
              Link {signInMethod.id}
            </button>
          </form>
        ) }
      </>
    );
  }
}

const LoginManagement = withFirebase(_LoginManagement);

const condition = authUser => !!authUser;

export default compose(
  withEmailVerification,
  withAuthorization(condition),
)(AccountPage);
