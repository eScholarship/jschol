// ##### Server Error Component ##### //

import React from 'react'

class ServerErrorComp extends React.Component {
  render() {
    return (
      <div className="c-servererror">
        <h1 className="c-servererror__message">
          I couldn't find what you were looking for.
        </h1>
        <img className="c-servererror__image" src="images/squirrel.jpg" alt="squirrel"/>
        <div className="c-servererror__search">
          <label htmlFor="c-servererror__input" className="c-servererror__label">Search for it!</label>
          <input type="search" className="c-servererror__input" id="c-servererror__input" placeholder="Search for it!" />
          <button className="c-servererror__button" aria-label="Search"></button>
        </div>
        <small>If you think this is a problem with eScholarship, please <a href="">contact us</a>.</small>
        <small>Or return to the <a href="/">homepage</a>.</small>
      </div>
    )
  }
}

module.exports = ServerErrorComp;
