// ##### Scholarly Works Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import RightsComp from '../components/RightsComp.jsx'
import $ from 'jquery'
import { Link } from 'react-router'
import TruncationObj from '../objects/TruncationObj.jsx'
import MediaListComp from '../components/MediaListComp.jsx'
import ArbitraryHTMLComp from '../components/ArbitraryHTMLComp.jsx'

class DotAuthorUl extends React.Component {
  render = () =>
    <TruncationObj element="ul" className={this.props.className}
                options={{watch:"window", after:'.c-authorlist__list-more-link', ellipsis:' ', wrap:'children'}}>
      {this.props.children}
    </TruncationObj>
}

class ScholWorksComp extends React.Component {
  static propTypes = {
    h: PropTypes.string.isRequired,
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
    let tagList = []
    if (pr.genre === 'article') {
      tagList.push({display: 'Article', tagStyle: 'article'})
    }
    if (pr.genre === 'monograph') {
      tagList.push({display: 'Book', tagStyle: 'book'})
    }
    if (pr.genre === 'dissertation') {
      tagList.push({display: 'Thesis', tagStyle: 'thesis'})
    }
    if (pr.genre === 'multimedia') {
      tagList.push({display: 'Multimedia', tagStyle: 'multimedia'})
    }
    if (pr.peerReviewed === true) {
      tagList.push({display: 'Peer Reviewed', tagStyle: 'peer'})
    }
    
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
    return (
      <section className="c-scholworks">
        <div className="c-scholworks__main-column">
          <ul className="c-scholworks__tag-list">
            { tagList.map(function(tag, i, a) { 
              return (
                <li key={tag+i} className={ "c-scholworks__tag-" + tag.tagStyle }>{tag.display}</li>
              ) 
            }) }
          </ul>
          <heading>
            <TruncationObj element={this.props.h} className="c-scholworks__heading">
              <a href={itemLink}><ArbitraryHTMLComp html={pr.title}/></a>
            </TruncationObj>
          </heading>
          {authorList && 
            <div className="c-authorlist">
              <DotAuthorUl className="c-authorlist__list">
                {authorList}
                <li><a href={itemLink} className="c-authorlist__list-more-link">et al.</a></li>
              </DotAuthorUl>
            </div>
          }
          {pr.pub_year && publishingInfo && 
            <div className="c-scholworks__publication">
              <Link to={"/uc/" + unitId}>{publishingInfo}</Link> ({pr.pub_year})
            </div>
          }
          {pr.abstract && 
            <TruncationObj element="div" className="c-scholworks__abstract">
              <ArbitraryHTMLComp html={pr.abstract} h1Level={3}/>
            </TruncationObj>
          }
          <div className="c-scholworks__media">
            <MediaListComp supp_files={pr.supp_files} />
            {pr.rights && <RightsComp rights={pr.rights} size="small" />}
          </div>
        </div>
        {pr.thumbnail && <Link to={itemLink} className="c-scholworks__thumbnail"><img src={"/assets/"+pr.thumbnail.asset_id} alt={`Cover page: ${pr.title}`} /></Link>}
      </section>
    )
  }
}

module.exports = ScholWorksComp
