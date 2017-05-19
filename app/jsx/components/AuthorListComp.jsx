// ##### Author List Component ##### //

import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'

class AuthorListComp extends React.Component {
  componentDidMount() {
    $('.c-authorlist__list').dotdotdot({watch:'window', after:'.c-authorlist__list-more-link', ellipsis:' ', wrap:'children',
      // Note: dotdotdot destroys event handlers we put on the et al. <Link>, so we have to install
      // the event handler *after* it initializes.
      callback: () => $('.c-authorlist__list').find("a").click((e)=>this.handleClick(e, 4))
    })
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
              {/* Note: the <a> more-link below cannot be a <Link>, else jquery dotdotdot can't recognize it */}
              <li><a href="" className="c-authorlist__list-more-link">et al.</a></li>
            </ul>
        }
      </div>
    )
  }
}

module.exports = AuthorListComp;
