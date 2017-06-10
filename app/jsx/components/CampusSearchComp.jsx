// ##### Campus Search Component ##### //

import React from 'react'
import Form from 'react-router-form'

class CampusSearchComp extends React.Component {
  render() {
    let search = '/uc/' + this.props.campusID + '/search'
    return (
    <Form to={search} method="GET">
      <div className="c-campussearch">
        <label htmlFor="c-campussearch__search" className="c-campussearch__label">Discover {this.props.campusName} scholarship</label>
        <div id="c-campussearch__search" className="c-campussearch__search">
          <input type="search" name="q" className="c-campussearch__input"/>
          <button type="submit" className="c-campussearch__button" aria-label="Search"></button>
        </div>
      {this.props.dashUrl &&
        <small className="c-campussearch__subtext">
          Looking for research data? <a href={this.props.dashUrl}>Visit {this.props.campusName} Dash</a>.
        </small>
      }
      </div>
    </Form>
    )
  }
}

module.exports = CampusSearchComp;
