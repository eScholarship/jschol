// ##### Author List Component ##### //

import React from 'react'
import TruncationObj from '../objects/TruncationObj.jsx'

const AuthorListComp = ({ authors, editors, advisors, author_hide, no_link, pubdate, source, changeTab }) => {
  const renderName = (name) => {
    if (no_link) return <span>{name}</span>
    return <a href={"/search/?q=" + encodeURIComponent("author:" + name)}>{name}</a>
  }

  // render one role (Author/Editor/Advisor) as an array of <li> elements
  // names are separated with ";"
  // Editor/Advisor groups are prefixed with a "Role(s):" heading
  const renderRole = (title, people) => {
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
          {renderName(person.name)}
          {!isLast && ";"}{" "}
        </li>
      )
    })
  }

  const yearMatch = pubdate ? pubdate.match(/\d{4}/) : null
  const year = yearMatch ? yearMatch[0] : null
  const showCopyright = year && (source === 'ojs' || source === 'janeway')
  const isTabbedItemPage = !!changeTab

  const authorItems  = !author_hide ? renderRole("Author",  authors)  : []
  const editorItems  = renderRole("Editor",  editors)
  const advisorItems = renderRole("Advisor", advisors)
  const allItems = [...authorItems, ...editorItems, ...advisorItems]

  const hasContributors = allItems.length > 0
  const showEtAl = allItems.length > 6

  return (
    <div className="c-authorlist" {...(hasContributors && { role: "group", "aria-label": "Authors" })}>
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

export default AuthorListComp
