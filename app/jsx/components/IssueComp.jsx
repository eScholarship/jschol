// ##### Issue Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import $ from 'jquery'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class IssueComp extends React.Component {
  openAndAdjust = event => {
    $(this.caption).trigger('destroy')
    $(this.caption).removeClass("c-issue__caption-truncate")
    if (this.descr) {
      $(this.descr).height($(this.descr)[0].offsetHeight + $(this.caption)[0].offsetHeight - 40)
    }
  }

  handleMissingThumbnail = event => {
    $(this.title).css( "left", "0" )
  }

  componentDidMount() {
    if (this.caption) {
      $(this.caption).dotdotdot({
         watch: 'window',
         after: '.c-issue__caption-truncate-more',
         callback: () => $(this.caption).find(".c-issue__caption-truncate-more").click(this.openAndAdjust)
      });
      setTimeout(() => $(this.caption).trigger('update'), 0) // removes 'more' link upon page load if less than truncation threshold (max-height), or if no max-height is applied (mobile)
    }
    if (!(this.thumbnail)) { this.handleMissingThumbnail() }
  }

  render() {
    let p = this.props
    return (
      <div className="c-issue">
      {p.title &&
        <h3 ref={e => this.title = e}>{p.title}</h3>
      }
      {p.cover &&
        <figure className="c-issue__thumbnail" ref={e => this.thumbnail = e}>
          <LazyImageComp src={"/cms-assets/"+p.cover.asset_id} alt="Issue cover" clickable={true}/>
        {p.cover.caption &&
          <figcaption className="c-issue__caption-truncate" ref={e => this.caption = e}>
            <div><i>Cover Caption:</i> {p.cover.caption} <button className="c-issue__caption-truncate-more">More</button></div>
          </figcaption>
        }
        </figure>
      }
      {p.description &&
        <div className="c-issue__description" ref={e => this.descr = e}>
          <ArbitraryHTMLComp html={p.description} h1Level={3}/>
        </div>
      }
      </div>
    )
  }
}

export default IssueComp;
