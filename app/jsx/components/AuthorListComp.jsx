// ##### Author List Component ##### //

import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'
import TruncationObj from '../objects/TruncationObj.jsx'

class AuthorListComp extends React.Component {

  handleClick = (e,tab_id) => {
    e.preventDefault()
    this.props.changeTab(tab_id)
  }

  render() {
    let p = this.props,
        year = p.pubdate.match(/\d{4}/),
        authorlist = p.authors.map((author, i) => { return (<li key={i+author.name}>{author.name}</li>) })
    return (
      <div className="c-authorlist">
        {year && <time className="c-authorlist__year">{year[0]}</time> }
        { !p.author_hide && p.authors &&
          <TruncationObj element="ul" className="c-authorlist__list"
                         options={{watch:'window', after:'.c-authorlist__list-more-link', ellipsis:' ', wrap:'children',
                                   callback: () => $('.c-authorlist__list-more-link').click((e)=>this.handleClick(e, 'author'))}}>
            {authorlist}
            {/* Note: the <a> more-link below cannot be a <Link>, else jquery dotdotdot can't recognize it */}
            <li><a href="" className="c-authorlist__list-more-link">et al.</a></li>
          </TruncationObj>
        }
      </div>
    )
  }
}

module.exports = AuthorListComp;
