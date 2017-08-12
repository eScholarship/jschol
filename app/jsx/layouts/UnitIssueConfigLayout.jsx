import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'
import _ from 'lodash'
import { Subscriber } from 'react-broadcast'

class RightsDropdown extends React.Component {
  render = () =>
    <select disabled={this.props.disableEdit}
            name={`rights-${this.props.voliss}`}
            defaultValue={this.props.rights || "none"}>
      <option value="none">None</option>
      <option value="CC BY">CC BY</option>
      <option value="CC BY-NC">CC BY-NC</option>
      <option value="CC BY-NC-ND">CC BY-NC-ND</option>
      <option value="CC BY-NC-SA">CC BY-NC-SA</option>
      <option value="CC BY-ND">CC BY-ND</option>
      <option value="CC BY-SA">CC BY-SA</option>
    </select>
}

class NumberingRadio extends React.Component {
  render = () =>
    <div>
      { _.map({volume_only: "volume", issue_only: "issue", both: "both"}, (v, k) =>
        <label key={k}>
          <input disabled={this.props.disableEdit} type="radio"
                 name={`numbering-${this.props.voliss}`} value={k}
                 defaultChecked={this.props.numbering == k}/>
          {v}
        </label>)}
    </div>
}

class IssueRow extends React.Component {
  render() {
    let p = this.props
    return (
      <tr>
        { !p.isDefault &&
          <td>{p.voliss}</td>
        }
        <td><RightsDropdown {...p}/></td>
        <td><NumberingRadio {...p}/></td>
        <td><input disabled={p.disableEdit} type="text" name={`buy_link-${p.voliss}`} defaultValue={p.buy_link}/></td>
      </tr>
    )
  }
}

class IssueTable extends React.Component {
  handleSubmit = (event, data) => {
    event.preventDefault()
    this.props.sendApiData("PUT", event.target.action, {data: data})
  }

  render() {
    let p = this.props
    return (
      <Form to={`/api/unit/${p.unit.id}/issueConfig`} onSubmit={this.handleSubmit}>
        <table className="c-issueTable">
          <thead>
            <tr>
              { !p.isDefault &&
                <th>Issue</th> }
              <th>License</th>
              <th>Numbering</th>
              <th>Buy Link</th>
            </tr>
          </thead>
          <tbody>
            { p.data.map(row =>
                <IssueRow key={row.voliss} isDefault={p.isDefault} disableEdit={p.disableEdit} {...row}/>) }
          </tbody>
        </table>
        { p.disableEdit
            ? <p>Only eScholarship staff may change this information.</p>
            : <button type="submit">Save Changes</button>
        }
      </Form>
    )
  }
}

export default class UnitIssueConfigLayout extends React.Component
{
  render = () =>
    <Subscriber channel="cms">
      { cms => {
          let p = this.props
          let tableProps = {
            unit: p.unit,
            sendApiData: p.sendApiData,
            disableEdit: !(cms.permissions && cms.permissions.super)
          }
          return (
            <div>
              <h3>Issue Configuration</h3>
              <div className="c-columns">
                <main>
                  <section className="o-columnbox1">
                    <h4>Defaults for Future Issues</h4>
                    <IssueTable isDefault={true} data={p.data.slice(0, 1)} {...tableProps}/>
                    <h4>Past Issues</h4>
                    <IssueTable isDefault={false} data={p.data.slice(1)} {...tableProps}/>
                  </section>
                </main>
              </div>
            </div>
          )
        }
      }
    </Subscriber>
}
