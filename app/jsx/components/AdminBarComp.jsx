// ##### AdminBar Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'

const AdminBarComp = (props) =>
  <Subscriber channel="adminLogin">{ adminLogin => adminLogin.loggedIn &&
    <div className="c-adminbar">
      <div className="c-adminbar__logged-in-msg">
        Logged in as '{adminLogin.username}'
      </div>
      <Subscriber channel="isPageEditable">{ isPageEditable => isPageEditable &&
        <div className="c-adminbar__edit-pg">
          <Subscriber channel="onEditingPageChange">{ onEditingPageChange =>
            <Subscriber channel="isEditingPage">{ isEditingPage =>
                <button className="c-adminbar__edit-pg-button" onClick={e=>onEditingPageChange(!isEditingPage)}>
                  {isEditingPage ? "Done editing" : "Edit page"}
                </button> }
            </Subscriber> }
          </Subscriber>
        </div> }
      </Subscriber>
    </div> }
  </Subscriber>

module.exports = AdminBarComp;
