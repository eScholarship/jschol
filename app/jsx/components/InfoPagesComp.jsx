// ##### Informational Pages Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import { Link } from 'react-router'
import NotYetLink from '../components/NotYetLink.jsx'
import PaginationComp from '../components/PaginationComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class ResultComp extends React.Component {
  static propTypes = {
    result: PropTypes.shape({
      isPage: PropTypes.bool.isRequired,
      topmost_name: PropTypes.string,             // Could be null
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
        {r.topmost_name &&
          <b>{r.topmost_name}</b> }
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
    query: PropTypes.shape({
      q: PropTypes.string,
      rows: PropTypes.string,
      sort: PropTypes.string,
      info_start: PropTypes.string,
      start: PropTypes.string,
    }).isRequired,
    infoResults: PropTypes.array.isRequired,
    info_count: PropTypes.number.isRequired
  }

  state={showMore: false}

  render() {
    return (
      <div className="c-infopages">
        <div className="c-infopages__show-less">
          <div className="c-infopages__items">
      {(this.props.info_count != 0 ) ? 
          this.props.infoResults.slice(0,3).map( (result) =>
            <ResultComp key={result.id} result={result} />)
        :
          <p><br/><br/>No results found.<br/><br/></p>
      }
          </div>
        {this.props.info_count > 3 && 
          <button className="c-infopages__toggle" onClick={()=> this.setState({showMore: true})} hidden={this.state.showMore}>Show more results</button> }
        </div>
        <div className="c-infopages__show-more" hidden={!this.state.showMore}>
          <div className="c-infopages__items">
          {this.props.infoResults.slice(3,12).map( (result) =>
            <ResultComp key={result.id} result={result} />) }
          </div>
        {(this.props.info_count > 12) ? 
          [<PaginationComp key="0" formName="facetForm" formButton="facet-form-submit" query={this.props.query} count={this.props.info_count} is_info={true} />,
          <button key="1" className="c-infopages__toggle" onClick={()=> this.setState({showMore: false})}>Show fewer results</button>]
        :
          <button className="c-infopages__toggle" onClick={()=> this.setState({showMore: false})}>Show fewer results</button>
        }
        </div>
      </div>
    )
  }
}

module.exports = InfoPagesComp;
