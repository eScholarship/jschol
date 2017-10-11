// ##### Recent Articles sidebar widget ##### //

import React from 'react'
import { Link } from 'react-router'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"

export default class RecentArticlesComp extends React.Component
{
  render = () =>
    <ul className="c-relateditems">
  { this.props.data.items.map(item =>
      <li key={item.id}>
        <h3>
          <Link className="o-textlink__secondary" to={`/uc/item/${item.id.replace(/^qt/, '')}`}>
            <ArbitraryHTMLComp html={item.title}/>
          </Link>
        </h3>
        <span>{ item.authors.map((author, idx) => (idx > 0 ? "; " : "") + author.name) }</span>
      </li>)
  }
    </ul>
}
