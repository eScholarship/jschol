// ##### Author List Component ##### //

import React from 'react'
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
      if (i==0 && array.length-1>0 && title !="Author") {
        return (<li key={i+x.name} className={c}><span className="c-authorlist__heading">{title}(s):</span> <a href={"/search/?q="+encodeURIComponent("author:"+x.name)}>{x.name}</a>&#59; </li>)
      } else if (i==0 && array.length-1==0 && title !="Author") {
        return (<li key={i+x.name} className={c}><span className="c-authorlist__heading">{title}(s):</span> <a href={"/search/?q="+encodeURIComponent("author:"+x.name)}>{x.name}</a> </li>)
      } else if (i<array.length-1) {
        return (<li key={i+x.name} className={c}><a href={"/search/?q="+encodeURIComponent("author:"+x.name)}>{x.name}</a>&#59; </li> )
      } else {
        return (<li key={i+x.name} className={c}><a href={"/search/?q="+encodeURIComponent("author:"+x.name)}>{x.name}</a> </li>) 
      } 
    })
  }

  render() {
    let p = this.props,
        year = p.pubdate ? (p.pubdate.match(/\d{4}/)) : null,
        source = p.source,
        authors = (p.authors && !p.author_hide) ? this.asList("Author", p.authors) : null,
        editors = p.editors ? this.asList("Editor", p.editors) : null,
        advisors = p.advisors ? this.asList("Advisor", p.advisors) : null,
        total_contributors = (authors ? authors.length : 0) + (editors ? editors.length : 0) + (advisors ? advisors.length : 0),
        this_is_an_item_page = p.pubdate ? true : false,
        this_is_a_tabbed_page = p.changeTab ? true: false,
        item_link = p.id ? "/uc/item/"+p.id.replace(/^qt/, "") : null
    return (
      <div className="c-authorlist">
        {year && <time className="c-authorlist__year">{year[0]}</time> }

        {/* CASE: this is an item page */}
        { ((authors && authors.length > 0) || (editors && editors.length > 0) ||
          (advisors && advisors.length > 0)) && this_is_an_item_page && this_is_a_tabbed_page &&
        <>
          <TruncationObj element="ul" className="c-authorlist__list">
            {authors}
            {editors}
            {advisors}
          </TruncationObj>
          {/* Show et al link if the total number of contributors is greater than 6 */}
          { (total_contributors > 6) &&  
            <a href="#author" className="c-authorlist__list-more-link">et al.</a>
          }
        </>
        }

        {/* CASE: this is NOT an item page */}
        { ((authors && authors.length > 0) || (editors && editors.length > 0) ||
           (advisors && advisors.length > 0)) && ! this_is_a_tabbed_page &&
          <TruncationObj element="ul" className="c-authorlist__list" lines={2}>
            {authors}
            {editors}
            {advisors}
          </TruncationObj>
        }
        {/* Only display a copyright if we have a year and source=ojs || janeway, otherwise skip it */}
        {year && (source === 'ojs' || source === 'janeway') && <div className="c-authorlist__copyright">&copy; {year[0]} by the author(s). <a href="https://escholarship.org/terms">Learn more</a>.</div> }
      </div>
    )
  }
}

export default AuthorListComp;
