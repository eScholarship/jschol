// ##### Author List Component ##### //

import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class AuthorListComp extends React.Component {
  componentDidMount() {
    $('.c-authorlist__list').dotdotdot({watch:'window', after:'.c-authorlist__list-more-link', ellipsis:' ', wrap:'children'});
    setTimeout(()=> $('.c-authorlist__list').trigger("update"), 0)
  }

  handleClick = (e,tab_id) => {
    e.preventDefault()
    this.props.changeTab(tab_id)
  }

  render() {
    let p = this.props,
        year = p.pubdate.match(/\d{4}/),
        authorlist = p.authors.map((author, i) => { return (<li key={i}>{author.name}</li>) })
    return (
      <div className="c-authorlist">
        {year && <time className="c-authorlist__year">{year[0]}</time> }
        { p.authors && 
            <ul className="c-authorlist__list">      
              {authorlist}
              <li>
                <Link to="#" className="c-authorlist__list-more-link" onClick={(e)=>this.handleClick(e, 4)}>et al.</Link>
              </li>
            </ul>
        }
      </div>
    )
  }
}

module.exports = AuthorListComp;
