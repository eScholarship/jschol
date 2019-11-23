import React from 'react'
import { Link } from 'react-router-dom'
import FormComp from '../components/FormComp.jsx'
import _ from 'lodash'
import Contexts from '../contexts.jsx'

export default class UnitUserConfigLayout extends React.Component
{
  state = { anyChanges: false }

  handleSubmit = (event, data, sendApiData) => {
    event.preventDefault()
    sendApiData("PUT", event.target.action, {data: data})
  }

  render = () =>
    <Contexts.CMS.Consumer>
      { cms => {
          let p = this.props,
              sendApiData = p.sendApiData,
              disableEdit = !(cms.permissions && cms.permissions.super)
          return (
            <div>
              <h3>User Configuration</h3>
              <div className="c-columns">
                <main>
                  <section className="o-columnbox1">
                    <FormComp to={`/api/unit/${p.unit.id}/userConfig`} onSubmit={(event, data) => this.handleSubmit(event, data, p.sendApiData)}>
                      <div className="c-datatable-nomaxheight">
                        <table>
                          <thead>
                            <tr>
                              <th scope="col">Name</th>
                              <th scope="col">Account</th>
                              <th scope="col">Admin</th>
                              <th scope="col">Stats</th>
                              <th scope="col">Submit</th>
                            </tr>
                          </thead>
                          <tbody>
                            { _.map(p.data.user_roles, row =>
                              <tr key={row.user_id}>
                                <td className="c-editable-tableCell">
                                  {row.name}
                                </td>
                                <td className="c-editable-tableCell">
                                  <Link to={`/userAccount/${row.user_id}`}>{row.email}</Link>
                                </td>
                                <td className="c-editable-tableCell">
                                  <input type="checkbox" name={`admin-${row.user_id}`} defaultChecked={row.roles.admin}
                                         disabled={disableEdit} onChange={()=>this.setState({anyChanges: true})}/>
                                </td>
                                <td className="c-editable-tableCell">
                                  <input type="checkbox" name={`stats-${row.user_id}`} defaultChecked={row.roles.stats}
                                         disabled={disableEdit} onChange={()=>this.setState({anyChanges: true})}/>
                                </td>
                                <td className="c-editable-tableCell">
                                  <input type="checkbox" name={`submit-${row.user_id}`} defaultChecked={row.roles.submit}
                                         disabled={disableEdit} onChange={()=>this.setState({anyChanges: true})}/>
                                </td>
                              </tr>
                            )}
                            <tr key="newuser">
                              <td className="c-editable-tableCell">
                                <i>(add role for user)</i>
                              </td>
                              <td className="c-editable-tableCell">
                                <input type="email" name="email-newuser" disabled={disableEdit} placeholder="existing email"/>
                              </td>
                              <td className="c-editable-tableCell">
                                <input type="checkbox" name="admin-newuser" disabled={disableEdit} onChange={()=>this.setState({anyChanges: true})}/>
                              </td>
                              <td className="c-editable-tableCell">
                                <input type="checkbox" name="stats-newuser" disabled={disableEdit} onChange={()=>this.setState({anyChanges: true})}/>
                              </td>
                              <td className="c-editable-tableCell">
                                <input type="checkbox" name="submit-newuser" disabled={disableEdit} onChange={()=>this.setState({anyChanges: true})}/>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <button type="submit" disabled={!this.state.anyChanges} className="c-editable-pCell">Save changes</button>
                    </FormComp>
                  </section>
                </main>
              </div>
            </div>
          )
        }
      }
    </Contexts.CMS.Consumer>
}
