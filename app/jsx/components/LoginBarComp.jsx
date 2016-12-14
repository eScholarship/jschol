// ##### LoginBar Component ##### //

import React from 'react'

class LoginBarComp extends React.Component {
  render() { 
    let p = this.props
    return(
      <div className="c-loginbar">
        <div className="c-loginbar__loggedInMsg">
          Logged in as '{p.loggedIn.username}'
        </div>
        <div className="c-loginbar__editPg">
          { p.loggedIn.editingPage ? 
              <button className="c-loginbar__editPgButton" onClick={e=>p.loggedIn.onEditingPageChange(false)}>Done editing</button>
            : <button className="c-loginbar__editPgButton" onClick={e=>p.loggedIn.onEditingPageChange(true)}>Edit page</button> }
        </div>
      </div>
    )
  }
}

module.exports = LoginBarComp;
