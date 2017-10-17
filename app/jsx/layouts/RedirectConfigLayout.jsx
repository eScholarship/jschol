import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import _ from 'lodash'
import { Subscriber } from 'react-broadcast'

class RedirRow extends React.Component {
  render() {
    let p = this.props
    return (
      <tr>
        <td><input type="text" id={`from-${p.id}`} defaultValue={p.from_path}/></td>
        <td><input type="text" id={`to-${p.id}`} defaultValue={p.from_path}/></td>
        <td><button>save</button><button>delete</button></td>
      </tr>
    )
  }
}

export default class RedirectConfigLayout extends React.Component
{
  static propTypes = {
    sendApiData: PropTypes.func.isRequired,
  }

  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                Redirects: {p.data.kind}
              </h1>
            </header>
            <p>Available redirect categories:</p>
            <ul>
              { ['static', 'item', 'unit', 'bepress', 'doj'].map(otherKind =>
                <li key={otherKind}>
                  { p.data.kind == otherKind
                    ? <b>« {otherKind} »</b>
                    : <Link to={"/uc/root/redirects/"+otherKind}>{otherKind}</Link>
                  }
                </li>
              )}
            </ul>
            <table className="c-redirectTable">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                { p.data.redirects.map(row => <RedirRow key={row.id} {...row}/>) }
                <tr>
                  <td><input type="text" id={`from-new`}/></td>
                  <td><input type="text" id={`to-new`}/></td>
                  <td><button>add</button></td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
      </div>
    )
  }
}
