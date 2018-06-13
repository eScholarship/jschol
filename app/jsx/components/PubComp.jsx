// ##### Publication Component ##### //

import React from 'react'
import Utils from '../utils.jsx'
import PropTypes from 'prop-types'
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

class PubComp extends React.Component {
  static propTypes = {
    h: PropTypes.string.isRequired,
    result: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      genre: PropTypes.string,
      peerReviewed: PropTypes.bool,
      author_hide: PropTypes.bool,
      authors: PropTypes.array,
      supp_files: PropTypes.array,
      pub_year: PropTypes.number,
      abstract: PropTypes.string,
      rights: PropTypes.string,
    }).isRequired,
  }

  render() {
    let pr = this.props.result
    let itemLink = "/uc/item/"+pr.id.replace(/^qt/, "")
    let authorList
    if (!pr.author_hide && pr.authors) {
      // Joel's CSS handles inserting semicolons here.
      authorList = pr.authors.map(function(author, i, a) {
        return (<li key={i}><a href={"/search/?q="+encodeURIComponent("author:"+author.name)}>
          {author.name}</a></li>)
      })
    }
    let totalSuppFiles = Utils.sumValueTotals(pr.supp_files, "count")
    return (
      <div className="c-pub">
        <TruncationObj element={this.props.h} className="c-pub__heading">
          <a href={itemLink}><ArbitraryHTMLComp html={pr.title}/></a>
        </TruncationObj>
      {authorList && 
        <div className="c-authorlist">
          <DotAuthorUl className="c-authorlist__list">
            {authorList}
            <li><a href={itemLink} className="c-authorlist__list-more-link">et al.</a></li>
          </DotAuthorUl>
        </div>
      }
      {pr.pub_year &&
        <div className="c-scholworks__publication">
          ({pr.pub_year})
        </div>
      }
      {pr.abstract && 
        <TruncationObj element="div" className="c-pub__abstract">
          <ArbitraryHTMLComp html={pr.abstract} p_wrap={true} h1Level={3}/>
        </TruncationObj>
      }
      {totalSuppFiles > 0 && 
        <MediaListComp supp_files={pr.supp_files} />
      }
      </div>
    )
  }
}

module.exports = PubComp;
