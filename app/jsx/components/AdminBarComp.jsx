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
        <Subscriber channel="cms">
          { cms => cms.isPageEditable &&
            <div className="c-adminbar__edit-pg">
              <button className="c-adminbar__edit-pg-button" onClick={e => cms.onEditingPageChange(!cms.isEditingPage)}>
                {cms.isEditingPage ? "Done editing" : "Edit page"}
              </button>
            </div>
          }
        </Subscriber>
      </div>
    }
  </Subscriber>

module.exports = AdminBarComp;
