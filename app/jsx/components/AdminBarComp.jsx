// ##### AdminBar Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'

const AdminBarComp = (props) =>
  <Subscriber channel="adminLogin">
    { adminLogin => adminLogin.loggedIn &&
        <div className="c-adminbar">
          <div className="c-adminbar__logged-in-msg">
            Logged in as '{adminLogin.username}'
          </div>
          { adminLogin.pageHasEditableComponents &&
            <div className="c-adminbar__edit-pg">
              <button className="c-adminbar__edit-pg-button" onClick={e=>p.admin.onEditingPageChange(!adminLogin.editingPage)}>
                {adminLogin.editingPage ? "Done editing" : "Edit page"}
              </button>
            </div>
          }
        </div>
    }
  </Subscriber>

module.exports = AdminBarComp;
