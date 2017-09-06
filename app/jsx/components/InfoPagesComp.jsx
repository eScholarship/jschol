// ##### Informational Pages Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import { Link } from 'react-router'
import NotYetLink from '../components/NotYetLink.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class ResultComp extends React.Component {
  static propTypes = {
    result: PropTypes.shape({
      isPage: PropTypes.bool.isRequired,
      ancestor_id: PropTypes.string,              // Parent Unit
      ancestor_name: PropTypes.string,
      target_id: PropTypes.string.isRequired,     // Unit or page
      target_name: PropTypes.string.isRequired, 
      content: PropTypes.string
    }).isRequired
  }

  componentDidMount() {
    $('.c-infopages__text').dotdotdot({watch:"window"});
  }

  render() {
    let r = this.props.result,
        target_path = r.isPage ? r.ancestor_id+"/"+r.target_id : r.target_id
    return (
      <div className="c-infopages__item">
        <h2>
        {r.ancestor_id && r.ancestor_name &&
          <Link to={"/uc/"+r.ancestor_id}>{r.ancestor_name}</Link> }
          <Link to={"/uc/"+target_path} className="c-infopages__title">{r.target_name}</Link>
        </h2>
      {r.content &&
        <div className="c-infopages__text" dangerouslySetInnerHTML={{__html: r.content}} /> }
      </div>
    )
  }
}
 
class InfoPagesComp extends React.Component {
  static propTypes = {
    infoResults: PropTypes.array.isRequired,
    info_count: PropTypes.number.isRequired
  }

  render() {
    return (
      <div className="c-infopages">
        <div className="c-infopages__items">
      {(this.props.info_count != 0 ) ? 
          this.props.infoResults.map( (result) =>
            <ResultComp key={result.id} result={result} />)
        :
          <p><br/><br/>No results found.<br/><br/></p>
      }
        </div>
      {this.props.info_count > 3 && 
        <NotYetLink element="a" className="c-infopages__all">Show all informational page results</NotYetLink> }
      </div>
    )
  }
}

module.exports = InfoPagesComp;
