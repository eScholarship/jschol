// ##### Pub Preview Component  - ##### //
// Very similar to Scholarly Works Comp. ToDo: Make parent class and extend both //
// Variables in ScholWorks not used here: tagList, peerReviewed, rights

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import PubComp from '../components/PubComp.jsx'

class PubPreviewComp extends React.Component {
  static propTypes = {
    h: PropTypes.string.isRequired,
    result: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      genre: PropTypes.string,
      peerReviewed: PropTypes.bool,
      journalInfo: PropTypes.any,
      unitInfo: PropTypes.any,
      authors: PropTypes.array,
      supp_files: PropTypes.array,
      pub_year: PropTypes.number,
      abstract: PropTypes.string,
      rights: PropTypes.string,
      thumbnail: PropTypes.shape({
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        asset_id: PropTypes.string.isRequired,
        timestamp: PropTypes.number.isRequired,
        image_type: PropTypes.string.isRequired 
      })
    }).isRequired,
  }
  render() {
    let pr = this.props.result
    let itemLink = "/uc/item/"+pr.id.replace(/^qt/, "")

    return (
      <div className="c-pubpreview">
      {pr.thumbnail &&
        <Link to={itemLink} className="c-pubpreview__img"><img src={"/assets/"+pr.thumbnail.asset_id} alt={`Cover page of ${pr.title}`} /></Link>
      }
        <PubComp result={this.props.result} h={this.props.h} />
      </div>
    )
  }
}

module.exports = PubPreviewComp
