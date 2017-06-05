// ##### Campus Search Component ##### //

import React from 'react'

class CampusSearchComp extends React.Component {
  render() {
    return (
      <div className="c-campussearch">
        <label htmlFor="c-campussearch__search" className="c-campussearch__label">Discover UC Berkeley scholarship</label>
        <div id="c-campussearch__search" className="c-campussearch__search">
          <input type="search" className="c-campussearch__input"/>
          <button className="c-campussearch__button" aria-label="Search"></button>
        </div>
        <small className="c-campussearch__subtext">
          Looking for research data? <a href="">Visit UC Berkeley Dash</a>.
        </small>
      </div>
    )
  }
}

module.exports = CampusSearchComp;
