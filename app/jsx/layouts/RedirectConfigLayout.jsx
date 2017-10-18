import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import _ from 'lodash'
import $ from 'jquery'
import { Subscriber } from 'react-broadcast'

class RedirRow extends React.Component {
  onSave = event => {
    const id = parseInt(event.target.dataset.id)
    this.props.sendApiData("PUT", `/api/redirect/${this.props.kind}/${id}`,
      { from_path: $(`#from-${id}`)[0].value,
        to_path:   $(`#to-${id}`)[0].value,
        descrip:   $(`#descrip-${id}`)[0].value })
  }

  onDelete = event => {
    if (!confirm("Delete redirect?"))
      return
    const id = parseInt(event.target.dataset.id)
    this.props.sendApiData("DELETE", `/api/redirect/${this.props.kind}/${id}`, {})
  }

  render() {
    let p = this.props
    return (
      <tr>
        <td><input type="text" id={`from-${p.id}`} defaultValue={p.from_path}/></td>
        <td><input type="text" id={`to-${p.id}`} defaultValue={p.to_path}/></td>
        <td><input type="text" id={`descrip-${p.id}`} defaultValue={p.descrip}/></td>
        <td>
          <button onClick={this.onSave} data-id={p.id}>save</button>
          <button onClick={this.onDelete} data-id={p.id}>delete</button>
        </td>
      </tr>
    )
  }
}

export default class RedirectConfigLayout extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      kind: PropTypes.string.isRequired,
      redirects: PropTypes.array.isRequired
    }).isRequired,
    sendApiData: PropTypes.func.isRequired,
  }

  onAdd = event => {
    const id = parseInt(event.target.dataset.id)
    this.props.sendApiData("POST", `/api/redirect/${this.props.data.kind}`,
      { from_path: $('#from-new')[0].value,
        to_path:   $('#to-new')[0].value,
        descrip:   $('#descrip-new')[0].value })
  }

  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                Sitewide Redirects
              </h1>
            </header>
            <p>Categories:
              { ['static', 'item', 'unit', 'bepress', 'doj'].map(otherKind =>
                <span key={otherKind}>
                  &#160;
                  { p.data.kind == otherKind
                    ? <b>{otherKind}</b>
                    : <Link to={"/uc/root/redirects/"+otherKind}>{otherKind}</Link>
                  }&#160;|
                </span>
              )}
            </p>
            <h3>{p.data.kind[0].toUpperCase() + p.data.kind.substring(1)} Redirects</h3>
            <table className="c-redirectTable">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Descrip</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                { p.data.redirects.map(row =>
                  <RedirRow key={row.id} kind={p.data.kind} sendApiData={p.sendApiData} {...row}/>) }
                <tr key="new">
                  <td><input type="text" id={`from-new`}/></td>
                  <td><input type="text" id={`to-new`}/></td>
                  <td><input type="text" id={`descrip-new`}/></td>
                  <td><button onClick={this.onAdd}>add</button></td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
      </div>
    )
  }
}
