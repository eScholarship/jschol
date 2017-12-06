// ##### Issue Component ##### //

import React from 'react'

class IssueComp extends React.Component {
  render() {
    let p = this.props
    let caption
    if (p.cover && p.cover.caption && p.cover.caption.length > 58) {
      caption = p.cover.caption.substring(0, 58)
      caption = (p.cover.caption.length > 58) ? caption + "..." : caption
    }
    return (
      <div className="c-issue">
      {p.title &&
        <h3>{p.title}</h3>
      }
      {p.cover &&
        <figure className="c-issue__thumbnail">
          <img src={"/assets/"+p.cover.asset_id} alt="Issue cover" />
        {caption &&
          <figcaption><i>Cover Caption:</i> {caption}</figcaption>
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
