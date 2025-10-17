// ##### Publication Component ##### //

import React from 'react'
import Utils from '../utils.jsx'
import PropTypes from 'prop-types'
import TruncationObj from '../objects/TruncationObj.jsx'
import MediaListComp from '../components/MediaListComp.jsx'
import ArbitraryHTMLComp from '../components/ArbitraryHTMLComp.jsx'
import AuthorListComp from '../components/AuthorListComp.jsx'
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
    let pr = this.props.result,
        itemLink = "/uc/item/"+pr.id.replace(/^qt/, "")

    let totalSuppFiles = Utils.sumValueTotals(pr.supp_files, "count")
    return (
      <div className="c-pub">
        <TruncationObj element={this.props.h} className="c-pub__heading">
          <a href={itemLink}><ArbitraryHTMLComp html={pr.title}/></a>
        </TruncationObj>

        <AuthorListComp author_hide={pr.author_hide}
                          authors={pr.authors}
                          editors={pr.editors}
                          advisors={pr.advisors}
                          id={pr.id}/>
                            
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

export default PubComp;
