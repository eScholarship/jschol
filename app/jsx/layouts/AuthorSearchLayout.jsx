import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import FormComp from '../components/FormComp.jsx'

export default class AuthorSearchLayout extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      search_str: PropTypes.string,
      authors: PropTypes.array
    }).isRequired,
    sendApiData: PropTypes.func.isRequired,
  }

  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent" tabIndex="-1">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                Author/User Search
              </h1>
            </header>
            <FormComp to={p.location.pathname} method="GET">
              <label htmlFor="authSearchBox">Search for (email or name, partial ok): </label>
              <input type="text" size="40" name="q" id="authorSearchBox" defaultValue={p.data.search_str}/>&#160;
              <button type="submit">Go</button>
            </FormComp>
            { p.data.authors && p.data.authors.length > 0 &&
              <div className="c-datatable">
                <h2>Author matches</h2>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Stats link</th>
                      <th scope="col">Name(s)</th>
                      <th scope="col">Email(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    { _.map(p.data.authors, row =>
                      <tr key={row.person_id}>
                        <td className="c-editable-tableCell">
                          <Link to={`/uc/author/${row.person_id}/stats`}>{row.person_id}</Link>
                        </td>
                        <td className="c-editable-tableCell">
                          {_.map(row.names, name => <div key={name}>{name}</div>)}
                        </td>
                        <td className="c-editable-tableCell">
                          {_.map(row.emails, email => <div key={email}>{email}</div>)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            }
            { p.data.accounts && p.data.accounts.length > 0 &&
              <div className="c-datatable">
                <h2>User account matches</h2>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Email / account link</th>
                      <th scope="col">Name</th>
                      <th scope="col">Unit(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    { _.map(p.data.accounts, row =>
                      <tr key={row.email}>
                        <td className="c-editable-tableCell">
                          <Link to={`/userAccount/${row.user_id}`}>{row.email}</Link>
                        </td>
                        <td className="c-editable-tableCell">
                          { row.name }
                        </td>
                        <td className="c-editable-tableCell">
                          { _.map(row.units.slice(0,5), unit => <div key={unit}><Link to={`/uc/${unit}`}>{unit}</Link></div>) }
                          { row.units.length > 5 && <div key="...">...</div> }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            }
            { p.data.forwards && p.data.forwards.length > 0 &&
              <div className="c-datatable">
                <h2>Forwarded email matches</h2>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Current email / acct link</th>
                      <th scope="col">Previous email addr(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    { _.map(p.data.forwards, row =>
                      <tr key={row.user_id}>
                        <td className="c-editable-tableCell">
                          <Link to={`/userAccount/${row.user_id}`}>{row.cur_email}</Link>
                        </td>
                        <td className="c-editable-tableCell">
                          { _.map(row.prev_emails, pe => <div key={pe}>{pe}</div>) }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            }
          </section>
        </main>
      </div>
    )
  }
}
