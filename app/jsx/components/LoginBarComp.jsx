// ##### LoginBar Component ##### //

import React from 'react'

class LoginBarComp extends React.Component {
  render() { return(
    <div className="c-loginbar">
      Logged in as '{this.props.loggedIn.username}'
    </div>
  )}
}

module.exports = LoginBarComp;
