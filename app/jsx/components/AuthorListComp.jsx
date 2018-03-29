// ##### Author List Component ##### //

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import $ from 'jquery'
import { Link } from 'react-router'
import TruncationObj from '../objects/TruncationObj.jsx'

class AuthorListComp extends React.Component {

  handleClick = (e,tab_id) => {
    e.preventDefault()
    this.props.changeTab(tab_id)
  }

  // Expects an array containing hashes with a 'name' attribute [{name: "Stone, Elizabeth C.", }]
  // Returns array of just names, with first name prepended with a title
  titledNames = (title, array) => {
    return array.map((x, i) => {
      return (i==0) ? `${title}(s): ` + x.name : x.name })
  }

  render() {
    let p = this.props,
        year = p.pubdate.match(/\d{4}/),
        t_authornames = (p.authors && !p.author_hide) ? this.titledNames("Author", p.authors) : [""],
        t_editornames = p.editors ? this.titledNames("\xa0\xa0Editor", p.editors) : [""],
        t_advisornames = p.advisors ? this.titledNames("\xa0\xa0Advisor", p.advisors) : [""],
        combined = t_authornames.concat(t_editornames).concat(t_advisornames).filter(e => typeof e === 'string' && e !== ''),
        authorlist = combined.map((name, i) => { return (<li key={i+name}>{name}</li>) })
    return (
      <div className="c-authorlist">
        {year && <time className="c-authorlist__year">{year[0]}</time> }
        {/* The 'dangerouslySetInnerHTML' rigarmarole below is to keep React from getting upset about
            jquery.dotdotdot fiddling around with the author elements. */}
        { combined && combined.length > 0 &&
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
