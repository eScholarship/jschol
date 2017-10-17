// ##### Recent Articles sidebar widget ##### //

import React from 'react'
import { Link } from 'react-router'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import TruncationObj from '../objects/TruncationObj.jsx'

class AuthorsComp extends React.Component {
  render() {
    let authorList = this.props.authors.map(function(author, i, a) {
        return (<li key={i}>{author.name}</li>)
      })
    return (
      <div className="c-authorlist">
        <TruncationObj element="ul" className="c-authorlist__list"
                    options={{watch:"window", after:'foo', ellipsis:' ', wrap:'children'}}>
         {authorList}
         <li className="foo">&nbsp;...</li>
        </TruncationObj>
      </div>
    )
  }
}

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
      {item.authors && item.authors.length > 0 &&
        <AuthorsComp authors={item.authors} />
      }
      </li>)
  }
    </ul>
}
