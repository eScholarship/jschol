// ##### Author List Component ##### //

import React from 'react'
import { Link } from 'react-router'

class AuthorListComp extends React.Component {
  handleClick = (e,tab_id) => {
    e.preventDefault()
    this.props.changeTab(tab_id)
  }

  // Add "et al" Link to Author tab if number of authors exceeds 17 
  // ToDo: This should truncate after certain number of lines, not authors
  renderExpand = expand => { return(
    <li>
    {expand && 
      <Link href="#" onClick={(e)=>this.handleClick(e, 4)}>et al.</Link>
    }
    </li>
  )}

  render() {
    let p = this.props,
        fulldate = p.pubdate,
        year = fulldate.match(/\d{4}/),
        a = p.authors,
        expand = false
    if (p.authors && p.authors.length > 17) {
      a = a.slice(0, 16)
      expand = true
    }
    let authorlist = a.map((author, i, arr) => {
      let divider = (i < arr.length-1) && <span>;</span>
      return (
        <li key={i}><span>{author.name}</span>{divider}</li>
      )
    })
    return (
      <div className="c-authorlist">
        <time className="c-authorlist__year">{year && year[0]}</time>
        { p.authors && 
            <ul className="c-authorlist__list">      
              {authorlist} {this.renderExpand(expand)}
            </ul>
        }
      </div>
    )
  }
}

module.exports = AuthorListComp;
