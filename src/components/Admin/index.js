import React, { Component } from 'react';
import { Switch, Route, Link } from 'react-router-dom';
import { compose } from 'recompose';

import { withAuthorization, withEmailVerification } from '../Session';
import * as ROLES from '../../constants/roles';
import * as ROUTES from '../../constants/routes';
import { withFirebase } from '../Firebase';

const AdminPage = () => (
  <div>
    <h1>Admin</h1>
    <p>The Admin Page is accessible by every signed in admin user.</p>
    <Switch>
      <Route exact path={ROUTES.ADMIN_USER_DETAILS} component={UserItem} />
      <Route exact path={ROUTES.ADMIN} component={UserList} />
    </Switch>
  </div>
);

class _UserItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      user: null,
      ...props.location.state
    };
  }

  componentDidMount() {
    if (this.state.user) {
      return;
    }

    this.setState({ loading: true });

    this.props.firebase
      .user(this.props.match.params.id)
      .on('value', snapshot => {
        let user = snapshot.val();
        user.uid = user.uid || this.props.match.params.id;
        this.setState({
          user: user,
          loading: false
        });
      });
  }

  componentWillUnmount() {
    this.props.firebase.user(this.props.match.params.id).off();
  }

  onSendPasswordResetEmail = () => {
    this.props.firebase.resetPassword(this.state.user.email);
  };


  render() {
    const { user, loading } = this.state;

    return (
      <div>
        <h2>User ({ this.props.match.params.id })</h2>
        { loading && <div>Loading ...</div> }
        { user && (
          <div>
            <span>
              <strong>ID:</strong> { user.uid }
            </span>
            <span>
              <strong>E-Mail:</strong> { user.email }
            </span>
            <span>
              <strong>Username:</strong> { user.username }
            </span>
            <span>
              <button type="button" onClick={this.onSendPasswordResetEmail}>
                Send Password Reset
              </button>
            </span>
          </div>
        ) }
      </div>
    );
  }
}



class _UserList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      users: []
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.props.firebase.users().on('value', snapshot => {
      const usersObject = snapshot.val();

      const usersList = Object.keys(usersObject).map(key => ({
        ...usersObject[key],
        uid: key
      }));

      this.setState({
        loading: false,
        users: usersList
      });
    });
  }

  componentWillUnmount() {
    this.props.firebase.users().off();
  }

  render() {
    const { users, loading } = this.state;

    return (
      <div>
        <h2>Users</h2>
        { loading && <div>Loading ...</div> }
        <ul>
          { users.map(user => (
            <li key={user.uid}>
              <span>
                <strong>ID:</strong> { user.uid }
              </span>
              <span>
                <strong>Email:</strong> { user.email }
              </span>
              <span>
                <strong>Username:</strong> { user.username }
              </span>
              <span>
                <Link to={{ pathname: `${ROUTES.ADMIN}/users/${user.uid}`, state: { user } }}>
                  Details
                </Link>
              </span>
            </li>
          )) }
        </ul>
      </div>
    );
  }
}


const UserItem = withFirebase(_UserItem);
const UserList = withFirebase(_UserList);

const condition = authUser => authUser && !!authUser.roles[ROLES.ADMIN];

export default compose(
  withEmailVerification,
  withAuthorization(condition)
)(AdminPage);
