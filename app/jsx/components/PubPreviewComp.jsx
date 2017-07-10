// ##### Pub Preview Component  - ##### //
// Very similar to Scholarly Works Comp. ToDo: Make parent class and extend both //
// Variables in ScholWorks not used here: tagList, peerReviewed, rights

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import _ from 'lodash'
import { Link } from 'react-router'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class DotAuthorUl extends React.Component {
  componentDidMount() {
    $(this.domEl).dotdotdot({watch:"window", after:'.c-authorlist__list-more-link', ellipsis:' ', wrap:'children'})
    setTimeout(()=> $('.c-authorlist__list').trigger("update"), 0)
  }

  render = () =>
    <ul className={this.props.className} ref={el => this.domEl = el}>
      {this.props.children}
    </ul>
}

class DotDiv extends React.Component {
  componentDidMount() {
    $(this.domEl).dotdotdot({watch:"window"})
  }

  render = () =>
    <div className={this.props.className} ref={el => this.domEl = el}>
      {this.props.children}
    </div>
}

class DotH2 extends React.Component {
  componentDidMount() {
    $(this.domEl).dotdotdot({watch:"window"})
  }

  render = () =>
    <h2 className={this.props.className} ref={el => this.domEl = el}>
      {this.props.children}
    </h2>
}

class PubPreviewComp extends React.Component {
  static propTypes = {
    result: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      genre: PropTypes.string,
      peerReviewed: PropTypes.bool,
      journalInfo: PropTypes.shape({
        unitId: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired,
      }),
      unitInfo: PropTypes.shape({
        unitId: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired,
      }),
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
    let publishingInfo
    let unitId
    if ('journalInfo' in pr) {
      publishingInfo = pr.journalInfo.displayName
      unitId = pr.journalInfo.unitId
    } else if ('unitInfo' in pr) {
      publishingInfo = pr.unitInfo.displayName
      unitId = pr.unitInfo.unitId
    }

    let authorList
    if (pr.authors) {
      // Joel's CSS handles inserting semicolons here.
      authorList = pr.authors.map(function(author, i, a) {
        return (<li key={i}><a href={"/search/?q="+author.name}>{author.name}</a></li>)
      })
    }

    let supp_files = pr.supp_files.map(function(supp_file, i, a) {
      if (supp_file.count >= 1) {
        let display
        if (supp_file.type === 'video' || supp_file.type === 'image') {
          display = supp_file.count != 1 ? supp_file.type + 's' : supp_file.type
        } else if (supp_file.type === 'audio') {
          display = supp_file.count != 1 ? 'audio files' : 'audio file'
        } else if (supp_file.type === 'pdf') {
          display = supp_file.count != 1 ? 'additional PDFs' : 'additional PDF'
        }
        return (<li key={supp_file+i} className={"c-medialist__" + supp_file.type}>Contains {supp_file.count} {display}</li>)   
      }
    })
    return (
      <div className="c-pubpreview">
      {pr.thumbnail &&
        <Link to={itemLink} className="c-pubpreview__img"><img src={"/assets/"+pr.thumbnail.asset_id} width={pr.thumbnail.width} height={pr.thumbnail.height} alt="Article image" /></Link> }
        <div className="c-pub">
          <DotH2 className="c-pub__heading">
            <Link to={itemLink}>{pr.title}</Link>
          </DotH2>
          {authorList && 
            <div className="c-authorlist">
              <DotAuthorUl className="c-authorlist__list">
                {authorList}
                <li><Link to={itemLink} className="c-authorlist__list-more-link">et al.</Link></li>
              </DotAuthorUl>
            </div>
          }
          {pr.abstract && 
            <DotDiv className="c-scholworks__abstract">
              <p>{pr.abstract}</p>
            </DotDiv>
          }
          <ul className="c-medialist">{ supp_files }</ul>
        </div>
      </div>
    )
  }
}

module.exports = PubPreviewComp
