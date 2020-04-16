import React, { Component } from 'react';
import { compose } from 'recompose';

import {
  AuthUserContext, withAuthorization, withEmailVerification
} from '../Session';
import { withFirebase } from '../Firebase';

class _CourseList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      courses: []
    };
  }

  componentDidMount() {
    const { uid: userId } = this.props.authUser;

    this.setState({ loading: true }, () => {
      this.props.firebase
        .courses(userId)
        .orderByChild('orderPosition')
        .on('value', snapshot => {
          const courses = [];
          snapshot.forEach(child => {
            courses.push({
              id: child.key,
              title: child.val().title
            });
          });

          this.setState({
            courses,
            loading: false
          });
        }, err => {
          this.setState({ loading: false });
          console.error(err.code);
        });
    });
  }

  componentWillUnmount() {
    const { uid: userId } = this.props.authUser;
    this.props.firebase.courses(userId).off();
  }

  render() {
    const { loading, courses } = this.state;

    return loading
      ? <div>Loading courses...</div>
      : !courses.length
        ? <div>Add a course to get started</div>
        : <ul>
            { courses.map(({ id, title }) => <li key={id}>{ title }</li>) }
          </ul>;
  }
}

const CourseList = withFirebase(_CourseList);

const Home = () => (
  <AuthUserContext.Consumer>
  { authUser => (
    <div>
      <h1>Courses</h1>
      <CourseList authUser={authUser}/>
    </div>
  )}
  </AuthUserContext.Consumer>
);

const condition = authUser => !!authUser;

export default compose(
  withEmailVerification,
  withAuthorization(condition),
)(Home);
