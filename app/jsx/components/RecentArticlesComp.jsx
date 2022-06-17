// ##### Recent Articles sidebar widget ##### //

import React from 'react'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import AuthorListComp from '../components/AuthorListComp.jsx'

export default class RecentArticlesComp extends React.Component
{
  render = () =>
    <ul className="c-relateditems">
  { this.props.data.items.map(item =>
      <li key={item.id}>
        <h3>
          {/* Workaround for conflict between React and jquery.dotdotdot: we can't use a
              <Link> within truncated content. So, fall back to a plain ol' <a> tag. */}
          <a className="o-textlink__secondary" href={`/uc/item/${item.id.replace(/^qt/, '')}`}>
            <ArbitraryHTMLComp html={item.title}/>
          </a>
        </h3>
        <AuthorListComp   author_hide={item.author_hide}
                          authors={item.authors}
                          editors={item.editors}
                          advisors={item.advisors}
                          id={item.id} />
      </li>)
  }
    </ul>
}
