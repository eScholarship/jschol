// ##### Hero Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

class HeroComp extends React.Component {
  static propTypes = {
    hero_data: PropTypes.shape({
      unit_id: PropTypes.string.isRequired,
      unit_name: PropTypes.string.isRequired,
      hero: PropTypes.shape({
        url: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number
      })
    })
  }

  render() {
    let h = this.props.hero_data
    if (!h) return <div/>
    return (
      <div className="c-hero--black-text" style={{backgroundImage: "url(" + h.hero.url + ")"}}>
        <h1>Open Access Publications from the University of California</h1>
        <div className="c-hero__campuses">
          <span>{h.unit_name}</span>
          <Link to="/campuses">Explore all of our campuses</Link>
        </div>
      </div>
    )
  }
}

module.exports = HeroComp;
