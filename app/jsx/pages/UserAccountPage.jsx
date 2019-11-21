import React from 'react'
import { Link } from 'react-router-dom'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'
import FormComp from '../components/FormComp.jsx'

export default class UserAccountPage extends PageBase
{
  pagePermissionsUnit() {
    return 'root'
  }

  handleSubmit = (event, data) => {
    event.preventDefault()
    this.sendApiData("PUT", event.target.action, {data: data})
    this.setState({anyChanges: false})
  }

  renderData(data) {
    let fl = data.flags
    return(
      <div>
        <Header1Comp/>
        <MetaTagsComp title={"eScholarship"}/>
        <div className={this.state.fetchingData ? "c-columns is-loading-data" : "c-columns"}>
          <main id="maincontent" tabIndex="-1">
            <section className="o-columnbox1">
              <header>
                <h1 className="o-columnbox1__heading">User Account</h1>
              </header>

              <h2>{data.first_name} {data.last_name} &lt;{data.email}&gt;</h2>
              <div className="c-editable-pTable">
                <div className="c-editable-pRow">
                  <div className="c-editable-pCell">Registration date:</div>
                  <div className="c-editable-pCell">{data.registered}</div>
                </div>
                <div className="c-editable-pRow">
                  <div className="c-editable-pCell">Last login date:</div>
                  <div className="c-editable-pCell">{data.last_login}</div>
                </div>
              </div>
              <h3>Settings</h3>
              <FormComp to={`/api/userFlags/${data.user_id}`} onSubmit={this.handleSubmit}>
                <div className="c-editable-pTable">
                  <div className="c-editable-pRow">
                    <input id="flag_validated" type="checkbox" className="c-editable-pCell" name="flag_validated" defaultChecked={fl.validated}
                           onChange={()=>this.setState({anyChanges: true})}/>
                    <label htmlFor="flag_validated" className="c-editable-pCell">Validated email address</label>
                  </div>
                  <div className="c-editable-pRow">
                    <input id="flag_opted_out" type="checkbox" className="c-editable-pCell" name="flag_opted_out" defaultChecked={fl.opted_out}
                           onChange={()=>this.setState({anyChanges: true})}/>
                    <label htmlFor="flag_opted_out" className="c-editable-pCell">Opted out of emails</label>
                  </div>
                  <div className="c-editable-pRow">
                    <input id="flag_bouncing" type="checkbox" className="c-editable-pCell" name="flag_bouncing" defaultChecked={fl.bouncing}
                           onChange={()=>this.setState({anyChanges: true})}/>
                    <label htmlFor="flag_bouncing" className="c-editable-pCell">Bouncing email address</label>
                  </div>
                  <div className="c-editable-pRow">
                    <input id="flag_superuser" type="checkbox" className="c-editable-pCell" name="flag_superuser" defaultChecked={fl.superuser}
                           onChange={()=>this.setState({anyChanges: true})}/>
                    <label htmlFor="flag_superuser" className="c-editable-pCell">Super-user</label>
                  </div>
                </div>
                <div className="c-editable-pTable">
                  <div className="c-editable-pRow">
                    <label htmlFor="new_password" className="c-editable-pCell">Set new password:</label>
                    <input id="new_password" type="password" className="c-editable-pCell" name="new_password"
                           onChange={()=>this.setState({anyChanges: true})}/>
                  </div>
                </div>
                <div className="c-editable-pTable">
                  <div className="c-editable-pRow">
                    <button type="submit" disabled={!this.state.anyChanges} className="c-editable-pCell">Save changes</button>
                  </div>
                </div>
              </FormComp>

              { data.unit_roles.length > 0 &&
                <div>
                  <h3>Unit roles</h3>
                  <div className="c-datatable-nomaxheight">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Unit</th>
                          <th scope="col">Role(s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        { _.map(data.unit_roles, row =>
                          <tr key={row[0]}>
                            <td className="c-editable-tableCell">
                              { row[0] ? <Link to={`/uc/${row[0]}`}>{row[0]}</Link> : "<root>" }
                            </td>
                            <td className="c-editable-tableCell">
                              { row[1].join(", ") }
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              { data.journal_roles.length > 0 &&
                <div>
                  <h3>Journal roles</h3>
                  <div className="c-datatable-nomaxheight">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Journal</th>
                          <th scope="col">Role(s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        { _.map(data.journal_roles, jd =>
                          <tr key={jd[0]}>
                            <td className="c-editable-tableCell">
                              { jd[0] ? <Link to={`/uc/${jd[0]}`}>{jd[0]}</Link> : "<root>" }
                            </td>
                            <td className="c-editable-tableCell">
                              { jd[1].join(", ") }
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              { data.prev_emails.length > 0 &&
                <div>
                  <h3>Previous email addresses</h3>
                  <ul>
                    { _.map(data.prev_emails, addr =>
                      <li key={addr}>{addr}</li>
                    )}
                  </ul>
                </div>
              }

            </section>
          </main>
        </div>
      </div>
    )
  }

}
