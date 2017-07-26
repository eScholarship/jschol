// ##### Server Error Component ##### //

import React from 'react'
import Form from 'react-router-form'
import { Link } from 'react-router'
import PropTypes from 'prop-types'

class ServerErrorComp extends React.Component {
  static propTypes = {
    error: PropTypes.string.isRequired
  }

  render() {
    return (
      <div className="c-servererror">
        <h1 className="c-servererror__message">
          {this.props.error == "Not Found" ? "I couldn't find what you were looking for." :
           this.props.error ? this.props.error :
           "Error."}
        </h1>
        <img className="c-servererror__image" src="/images/squirrel.jpg" alt="squirrel"/>
        <Form to='/search' method="GET" className="c-servererror__search">
          <label htmlFor="c-servererror__input" className="c-servererror__label">Search for it!</label>
          <input type="search" className="c-servererror__input" name="q" id="c-servererror__input" placeholder="Search for it!" />
          <button className="c-servererror__button" aria-label="Search"></button>
        </Form>
        <small>If you think this is a problem with eScholarship, please <a href="http://help.escholarship.org">contact us</a>.</small>
        <small>Or return to the <Link to="/">homepage</Link>.</small>
      </div>
    )
  }
}

module.exports = ServerErrorComp;
