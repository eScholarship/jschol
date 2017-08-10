import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'

export default class UnitIssueConfigLayout extends React.Component
{
  handleSubmit = (event, data) => {
    event.preventDefault()
    this.props.sendApiData("PUT", event.target.action, {data: data})
  }

  render = () =>
    <div>
      <h3>Issue Configuration</h3>
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <h4>Defaults for Future Issues</h4>
            <Form to={`/api/unit/${this.props.unit.id}/issueConfig`} onSubmit={this.handleSubmit}>
              <table className="c-issueTable">
                <thead>
                  <tr>
                    <th>License</th>
                    <th>Show</th>
                    <th>Buy Link</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CC-BY-NC</td>
                    <td>Vol iss both</td>
                    <td>http://blah</td>
                  </tr>
                </tbody>
              </table>
              <button type="submit">Save Changes</button>
            </Form>
          </section>
        </main>
      </div>
    </div>
}
