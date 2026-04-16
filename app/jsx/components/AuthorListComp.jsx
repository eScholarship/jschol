// ##### Author List Component ##### //

import React from 'react'
import TruncationObj from '../objects/TruncationObj.jsx'

class AuthorListComp extends React.Component {
  renderName = (name) => {
    if (this.props.no_link) return <span>{name}</span>
    return <a href={"/search/?q=" + encodeURIComponent("author:" + name)}>{name}</a>
  }

  // render one role (Author/Editor/Advisor) as an array of <li> elements
  // names are separated with ";"
  // Editor/Advisor groups are prefixed with a "Role(s):" heading
  renderRole = (title, people) => {
    if (!people || people.length === 0) return []
    const showHeading = title !== "Author"
    return people.map((person, i) => {
      const isFirst = i === 0
      const isLast  = i === people.length - 1
      const className = isFirst ? "c-authorlist__begin"
                      : isLast  ? "c-authorlist__end"
                      : null
      return (
        <li key={title + i + person.name} className={className}>
          {isFirst && showHeading &&
            <span className="c-authorlist__heading">{title}(s):</span>}
          {isFirst && showHeading && " "}
          {this.renderName(person.name)}
          {!isLast && ";"}{" "}
        </li>
      )
    })
  }

  render() {
    const p = this.props
    const yearMatch = p.pubdate ? p.pubdate.match(/\d{4}/) : null
    const year = yearMatch ? yearMatch[0] : null
    const showCopyright = year && (p.source === 'ojs' || p.source === 'janeway')
    const isTabbedItemPage = !!p.changeTab

    const authorItems  = !p.author_hide ? this.renderRole("Author",  p.authors)  : []
    const editorItems  = this.renderRole("Editor",  p.editors)
    const advisorItems = this.renderRole("Advisor", p.advisors)
    const allItems = [...authorItems, ...editorItems, ...advisorItems]

    const hasContributors = allItems.length > 0
    const showEtAl = allItems.length > 6

    return (
      <div className="c-authorlist">
        {year && <time className="c-authorlist__year">{year}</time>}

        {hasContributors && isTabbedItemPage &&
          <>
            <TruncationObj element="ul" className="c-authorlist__list">
              {allItems}
            </TruncationObj>
            {showEtAl &&
              <a href="#author" className="c-authorlist__list-more-link">et al.</a>}
          </>
        }

        {hasContributors && !isTabbedItemPage &&
          <TruncationObj element="ul" className="c-authorlist__list" lines={2}>
            {allItems}
          </TruncationObj>
        }

        {showCopyright &&
          <div className="c-authorlist__copyright">
            &copy; {year} by the author(s). <a href="https://escholarship.org/terms">Learn more</a>.
          </div>
        }
      </div>
    )
  }
}

export default AuthorListComp
