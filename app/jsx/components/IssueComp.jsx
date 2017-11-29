// ##### Issue Component ##### //

import React from 'react'

class IssueComp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-issue">
      {p.title &&
        <h3>{p.title}</h3>
      }
      {p.cover &&
        <figure className="c-issue__thumbnail">
          <img src={"/assets/"+p.cover.asset_id} alt="Issue cover" />
        {p.cover.caption &&
          <figcaption><i>Cover Caption:</i> {p.cover.caption}</figcaption>
        }
        </figure>
      }
        <div className="c-issue__description">
          <p>{p.description}</p>
        </div>
      </div>
    )
  }
}

module.exports = IssueComp;
