// ##### Author List Component ##### //

import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router-dom'
import TruncationObj from '../objects/TruncationObj.jsx'

class AuthorListComp extends React.Component {

  handleClick = (e,tab_id) => {
    e.preventDefault()
    this.props.changeTab(tab_id)
  }

  // Expects an array containing hashes with a 'name' attribute [{name: "Stone, Elizabeth C.", }]
  // Returns list elements of just names, with first name prepended with a title
  asList = (title, array) => {
    return array.map((x, i) => {
      let c = (i==0) ? "c-authorlist__begin" : (i+1 == array.length) ? "c-authorlist__end" : null
      if (i==0) {
        return (<li key={i+x.name} className={c}><span className="c-authorlist__heading">{title}(s):</span> {x.name}&#59; </li>)
      } else if (i<array.length-1) {
        return (<li key={i+x.name} className={c}>{x.name}&#59; </li> )
      } else {
        return (<li key={i+x.name} className={c}>{x.name} </li>) 
      }
    })
  }

  render() {
    let p = this.props,
        year = p.pubdate.match(/\d{4}/),
        authors = (p.authors && !p.author_hide) ? this.asList("Author", p.authors) : null,
        editors = p.editors ? this.asList("Editor", p.editors) : null,
        advisors = p.advisors ? this.asList("Advisor", p.advisors) : null
    return (
      <div className="c-authorlist">
        {year && <time className="c-authorlist__year">{year[0]}</time> }
        { ((authors && authors.length > 0) || (editors && editors.length > 0) ||
           (advisors && advisors.length > 0)) &&
          <TruncationObj element="ul" className="c-authorlist__list"
                         options={{watch:'window', after:'.c-authorlist__list-more-link', ellipsis:' ', wrap:'children',
                                   callback: () => $('.c-authorlist__list-more-link').click((e)=>this.handleClick(e, 'author'))}}>
            {authors}
            {editors}
            {advisors}
            {/* Note: the <a> more-link below cannot be a <Link>, else jquery dotdotdot can't recognize it */}
            <li><a href="" className="c-authorlist__list-more-link">et al.</a></li>
          </TruncationObj>
        }

      </div>
    )
  }
}

export default AuthorListComp;
