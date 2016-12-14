// ##### AdminBar Component ##### //

import React from 'react'

class AdminBarComp extends React.Component {
  render() { 
    let p = this.props
    return(
      <div className="c-adminbar">
        <div className="c-adminbar__loggedInMsg">
          Logged in as '{p.admin.username}'
        </div>
        { p.admin.pageHasEditableComponents &&
          <div className="c-adminbar__editPg">
            <button className="c-adminbar__editPgButton" onClick={e=>p.admin.onEditingPageChange(!p.admin.editingPage)}>
              {p.admin.editingPage ? "Done editing" : "Edit page"}
            </button>
          </div>
        }
      </div>
    )
  }
}

module.exports = AdminBarComp;
