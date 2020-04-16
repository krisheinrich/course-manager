import React from 'react';
import AuthUserContext from './context';
import { withFirebase } from '../Firebase';

const needsEmailVerification = authUser =>
  authUser &&
  !authUser.emailVerified &&
  authUser.providerData
    .map(provider => provider.providerId)
    .includes('password');

const withEmailVerification = Component => {
  class WithEmailVerification extends React.Component {
    constructor(props) {
      super(props);

      this.state = { isSent: false };
    }

    onSendEmailVerification = () => {
      this.props.firebase.sendEmailVerification()
        .then(() => this.setState({ isSent: true }));
    }

    render() {
      const { isSent } = this.state;

      return (
        <AuthUserContext.Consumer>
          { authUser => 
            needsEmailVerification(authUser) ? (
              <div>
                { isSent ? (
                  <p>
                    Email confirmation sent: Check your inbox (spam
                    folder included) for a confirmation email.
                    Refresh this page once you confirm your email.
                  </p>
                ) : (
                  <p>
                    Verify your email: Check your inbox (spam folder
                    included) for a confirmation email or send
                    another confirmation email.
                  </p>
                ) }
                <button type="button" disabled={isSent}
                  onClick={this.onSendEmailVerification}
                >
                  Send confirmation Email
                </button>
              </div>
            ) : (
              <Component {...this.props} />
            )
          }
        </AuthUserContext.Consumer>
      );
    }
  }

  return withFirebase(WithEmailVerification);
};

export default withEmailVerification;