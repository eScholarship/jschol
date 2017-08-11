// ##### Publication Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import TruncationObj from '../objects/TruncationObj.jsx'
import MediaListComp from '../components/MediaListComp.jsx'

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
      authors: PropTypes.array,
      abstract: PropTypes.string,
    }).isRequired,
  }

  render() {
    let pr = this.props.result
    let itemLink = "/uc/item/"+pr.id.replace(/^qt/, "")
    let authorList
    if (pr.authors) {
      // Joel's CSS handles inserting semicolons here.
      authorList = pr.authors.map(function(author, i, a) {
        return (<li key={i}><a href={"/search/?q="+author.name}>{author.name}</a></li>)
      })
    }
    return (
      <div className="c-pub">
        <TruncationObj element={this.props.h} className="c-pub__heading">
          <Link to={itemLink}>{pr.title}</Link>
        </TruncationObj>
      {authorList && 
        <div className="c-authorlist">
          <DotAuthorUl className="c-authorlist__list">
            {authorList}
            <li><Link to={itemLink} className="c-authorlist__list-more-link">et al.</Link></li>
          </DotAuthorUl>
        </div>
      }
      {pr.abstract && 
        <TruncationObj element="div" className="c-pub__abstract">
          <p>{pr.abstract}</p>
        </TruncationObj>
      }
      {/*  <MediaListComp /> */}
      </div>
    )
  }
}

module.exports = PubComp;
