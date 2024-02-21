import React from 'react'
import { Link } from 'react-router-dom'
import FormComp from '../components/FormComp.jsx'
import _ from 'lodash'
import Contexts from '../contexts.jsx'

class RightsDropdown extends React.Component {
  render = () =>
    <select disabled={this.props.disableEdit}
            name={`rights-${this.props.voliss}`}
            defaultValue={this.props.rights || "none"}>
      <option value="none">None</option>
      <option value="https://creativecommons.org/licenses/by/4.0/">CC BY v4.0</option>
      <option value="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC v4.0</option>
      <option value="https://creativecommons.org/licenses/by-nc-nd/4.0/">CC BY-NC-ND v4.0</option>
      <option value="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA v4.0</option>
      <option value="https://creativecommons.org/licenses/by-nd/4.0/">CC BY-ND v4.0</option>
      <option value="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA v4.0</option>
      <option value="https://creativecommons.org/licenses/by/3.0/">(old CC BY v3.0)</option>
      <option value="https://creativecommons.org/licenses/by-nc/3.0/">(old CC BY-NC v3.0)</option>
      <option value="https://creativecommons.org/licenses/by-nc-nd/3.0/">(old CC BY-NC-ND v3.0)</option>
      <option value="https://creativecommons.org/licenses/by-nc-sa/3.0/">(old CC BY-NC-SA v3.0)</option>
      <option value="https://creativecommons.org/licenses/by-nd/3.0/">(old CC BY-ND v3.0)</option>
      <option value="https://creativecommons.org/licenses/by-sa/3.0/">(old CC BY-SA v3.0)</option>
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

class PubDateRadio extends React.Component {
  render = () =>
  <div>
  { _.map({"true": "on", "false": "off"}, (v, k) =>
    <label key={k}>
      <input disabled={this.props.disableEdit} type="radio"
             name={`show_pub_dates-${this.props.voliss}`} value={k}
             defaultChecked={this.props.show_pub_dates == k}/>
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
        <td><PubDateRadio {...p}/></td>
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
      <FormComp to={`/api/unit/${p.unit.id}/issueConfig`} onSubmit={this.handleSubmit}>
        <table className="c-issueTable">
          <thead>
            <tr>
              { !p.isDefault &&
                <th>Issue</th> }
              <th>License</th>
              <th>Numbering</th>
              <th>Buy Link</th>
              <th>Show publication dates</th>
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
      </FormComp>
    )
  }
}

export default class UnitIssueConfigLayout extends React.Component
{
  render = () =>
    <Contexts.CMS.Consumer>
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
    </Contexts.CMS.Consumer>
}
