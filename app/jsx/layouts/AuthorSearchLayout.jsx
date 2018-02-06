import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import _ from 'lodash'
import Form from 'react-router-form'

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
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                Author Search
              </h1>
            </header>
            <Form to={p.location.pathname} method="GET">
              <label htmlFor="authSearchBox">Email/name (partial ok): </label>
              <input type="text" size="40" name="q" id="authorSearchBox" defaultValue={p.data.search_str}/>&#160;
              <button type="submit">Go</button>
            </Form>
            <br/><br/>
            { p.data.authors && p.data.authors.length > 0 &&
              <div className="c-datatable">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Stats link</th>
                      <th scope="col">Name(s)</th>
                      <th scope="col">Email(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    { _.map(p.data.authors, data =>
                      <tr key={data.person_id}>
                        <td className="c-editable-tableCell">
                          <Link to={`/uc/author/${data.person_id}/stats`}>{data.person_id}</Link>
                        </td>
                        <td className="c-editable-tableCell">
                          {_.map(data.names, name => <div key={name}>{name}</div>)}
                        </td>
                        <td className="c-editable-tableCell">
                          {_.map(data.emails, email => <div key={email}>{email}</div>)}
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
