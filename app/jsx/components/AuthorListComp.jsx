// ##### Author List Component ##### //

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import $ from 'jquery'
import { Link } from 'react-router'

class AuthorListComp extends React.Component {
  activateTruncation() {
    $('.c-authorlist__list').dotdotdot({watch:'window', after:'.c-authorlist__list-more-link', ellipsis:' ', wrap:'children',
      // Note: dotdotdot destroys event handlers we put on the et al. <Link>, so we have to install
      // the event handler *after* it initializes.
      callback: () => $('.c-authorlist__list').find("a").click((e)=>this.handleClick(e, 'author'))
    })
    setTimeout(()=> $('.c-authorlist__list').trigger("update"), 0)
  }

  componentDidMount() {
    this.activateTruncation()
  }

  handleClick = (e,tab_id) => {
    e.preventDefault()
    this.props.changeTab(tab_id)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.authors != nextProps.authors) {
      this.activateTruncation()
    }
  }

  render() {
    let p = this.props,
        year = p.pubdate.match(/\d{4}/),
        authorlist = p.authors.map((author, i) => { return (<li key={i+author.name}>{author.name}</li>) })
    return (
      <div className="c-authorlist">
        {year && <time className="c-authorlist__year">{year[0]}</time> }
        {/* The 'dangerouslySetInnerHTML' rigarmarole below is to keep React from getting upset about
            jquery.dotdotdot fiddling around with the author elements. */}
        { p.authors && 
          <div dangerouslySetInnerHTML={{__html: ReactDOMServer.renderToStaticMarkup(
            <ul className="c-authorlist__list">
              {authorlist}
              {/* Note: the <a> more-link below cannot be a <Link>, else jquery dotdotdot can't recognize it */}
              <li><a href="" className="c-authorlist__list-more-link">et al.</a></li>
            </ul>
          )}}/>
        }
      </div>
    )
  }
}

module.exports = AuthorListComp;
