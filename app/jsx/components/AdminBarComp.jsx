// ##### AdminBar Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'

const AdminBarComp = (props) =>
  <Subscriber channel="cms">
    { cms =>
      <div style={{ marginTop: (cms.permissions && cms.permissions.admin && cms.modules) ? "-20px" : "-10px" }}>
        { cms.loggedIn &&
          <div className="c-adminbar">
            <div className="c-adminbar__logged-in-msg">
              Logged in as '{cms.username}'
            </div>
            { cms.permissions && cms.permissions.admin && cms.modules &&
              <div className="c-adminbar__edit-pg">
                <button className="c-adminbar__edit-pg-button" onClick={e => cms.onEditingPageChange(!cms.isEditingPage)}>
                  {cms.isEditingPage ? "Done editing" : "Edit page"}
                </button>
              </div>
            }
          </div>
        }
      </div>
    }
  </Subscriber>

module.exports = AdminBarComp;
