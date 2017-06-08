// ##### Campus Search Component ##### //

import React from 'react'

class CampusSearchComp extends React.Component {
  render() {
    const dashUrl = { 
      'ucb': 'https://dash.berkeley.edu/stash',
      'uci': 'https://dash.lib.uci.edu/stash',
      'ucm': 'https://dash.ucmerced.edu/stash',
      'ucop': 'https://dash.ucop.edu/stash',
      'ucr': 'https://dash.ucr.edu/stash',
      'ucsc': 'https://dash.library.ucsc.edu/stash',
      'ucsf': 'https://datashare.ucsf.edu/stash',
    } 
    let dash = Object.keys(dashUrl).includes(this.props.campusID)
    return (
      <div className="c-campussearch">
        <label htmlFor="c-campussearch__search" className="c-campussearch__label">Discover {this.props.campusName} scholarship</label>
        <div id="c-campussearch__search" className="c-campussearch__search">
          <input type="search" className="c-campussearch__input"/>
          <button className="c-campussearch__button" aria-label="Search"></button>
        </div>
      {dash &&
        <small className="c-campussearch__subtext">
          Looking for research data? <a href={dashUrl[this.props.campusID]}>Visit {this.props.campusName} Dash</a>.
        </small>
      }
      </div>
    )
  }
}

module.exports = CampusSearchComp;
