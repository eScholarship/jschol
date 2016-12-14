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
        { p.admin.pageHasEditableComponents ?
          <div className="c-adminbar__editPg">
            { p.admin.editingPage ? 
                <button className="c-adminbar__editPgButton" onClick={e=>p.admin.onEditingPageChange(false)}>Done editing</button>
              : <button className="c-adminbar__editPgButton" onClick={e=>p.admin.onEditingPageChange(true)}>Edit page</button>
            }
          </div>
          : null
        }
      </div>
    )
  }
}

module.exports = AdminBarComp;
