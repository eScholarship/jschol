// ##### Recent Articles sidebar widget ##### //

import React from 'react'
import { Link } from 'react-router'

export default class RecentArticlesComp extends React.Component
{
  render = () =>
    <div>
      { this.props.data.items.map(item =>
          <p key={item.id}>
            <Link className="o-textlink__secondary" to={`/uc/item/${item.id.replace(/^qt/, '')}`}>{item.title}</Link>
            <br/>
            { item.authors.map((author, idx) => (idx > 0 ? "; " : "") + author.name) }
          </p>)
      }
    </div>
}
