// ##### Scholarly Works Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
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

class ScholWorksComp extends React.Component {
  static propTypes = {
    result: PropTypes.shape({
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
        } else if (true || supp_file.type === 'audio') {
          display = supp_file.count != 1 ? 'audio files' : 'audio file'
        } else if (supp_file.type === 'pdf') {
          display = supp_file.count != 1 ? 'additional PDFs' : 'additional PDF'
        }
        return (<li key={supp_file+i} className={"c-scholworks__media-" + supp_file.type}>Contains {supp_file.count} {display}</li>)   
      }
    })
    // console.log(pr.supp_files)
    if ('supp_files' in pr && pr.supp_files !== null) {
      if ('video' in pr.supp_files && pr.supp_files.video !== 0) {
        supp_files.append(<li className="c-scholworks__media-video">Contains {pr.supp_files.video} videos</li>)
      }
      if ('image' in pr.supp_files && pr.supp_files.image !== 0) {
        supp_files.append(<li className="c-scholworks__media-image">Contains {pr.supp_files.image} images</li>)
      }
      if ('pdf' in pr.supp_files && pr.supp_files.pdf !== 0) {
        supp_files.append(<li className="c-scholworks__media-pdf">Contains {pr.supp_files.pdf} additional PDFs</li>)
      }
      if ('audio' in pr.supp_files && pr.supp_files.audio !== 0) {
        supp_files.append(<li className="c-scholworks__media-audio">Contains {pr.supp_files.audio} audio files</li>)
      }
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
            <DotH2 className="c-scholworks__heading">
              <Link to={"/uc/item/"+pr.id.replace(/^qt/, "")}>{pr.title}</Link>
            </DotH2>
          </heading>
          {authorList && 
            <div className="c-authorlist">
              <DotAuthorUl className="c-authorlist__list">
                {authorList}
                <li><a href="" className="c-authorlist__list-more-link">et al.</a></li>
              </DotAuthorUl>
            </div>
          }
          {pr.pub_year && publishingInfo && 
            <div className="c-scholworks__publication">
              <Link to={"/uc/" + unitId}>{publishingInfo}</Link> ({pr.pub_year})
            </div>
          }
          {pr.abstract && 
            <DotDiv className="c-scholworks__abstract">
              <p>{pr.abstract}</p>
            </DotDiv>
          }
          <div className="c-scholworks__media">
            <ul className="c-scholworks__media-list">{ supp_files }</ul>
            {pr.rights && pr.rights !== 'public' && <img className="c-scholworks__rights" src="/images/cc-by-small.svg" alt="creative commons attribution 4.0 international public license"/>}
          </div>
        </div>
        {pr.thumbnail && <img className="c-scholworks__article-preview" src={"/assets/"+pr.thumbnail.asset_id} width={pr.thumbnail.width} height={pr.thumbnail.height} alt="Article image" />}
      </section>
    )
  }
}

module.exports = ScholWorksComp
