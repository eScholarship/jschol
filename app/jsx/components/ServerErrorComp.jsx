// ##### Server Error Component ##### //

import React from 'react'
import FormComp from '../components/FormComp.jsx'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import MEDIA_PATH from '../../js/MediaPath.js'

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
        <img className="c-servererror__image" src={MEDIA_PATH + 'squirrel.jpg'} alt="squirrel"/>
        <FormComp to='/search' method="GET" className="c-servererror__search">
          <label htmlFor="c-servererror__input" className="c-servererror__label">Search for it!</label>
          <input type="search" className="c-servererror__input" name="q" id="c-servererror__input" placeholder="Search for it!" />
          <button className="c-servererror__button" aria-label="Search"></button>
        </FormComp>
        <small>If you think this is a problem with eScholarship, please visit our <a href="https://help.escholarship.org/support/solutions/articles/9000171663">Help Center</a>.</small>
        <small>Or return to the <Link to="/">homepage</Link>.</small>
        <div style={{display: "none"}} id="serverError">{this.props.error}</div> {/* signal to server.rb */}
      </div>
    )
  }
}

module.exports = ServerErrorComp;
