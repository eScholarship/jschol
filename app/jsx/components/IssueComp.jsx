// ##### Issue Component ##### //

import React from "react"
import LazyImageComp from "../components/LazyImageComp.jsx"
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import TruncationObj from "../objects/TruncationObj.jsx"

class IssueComp extends React.Component {
  handleMissingThumbnail = event => {
    if (this.title) {
      this.title.style.left = "0"
    }
  }

  componentDidMount() {
    if (!(this.thumbnail)) { this.handleMissingThumbnail() }
  }

  render() {
    let p = this.props
    const hasHTMLCaption = p.cover?.caption && /<[a-z][\s\S]*>/i.test(p.cover.caption)
    
    return (
      <div className="c-issue">
        {p.title &&
          <h3 ref={e => this.title = e} dangerouslySetInnerHTML={{__html: p.title}}></h3>
        }
        {p.cover &&
          <figure className="c-issue__thumbnail" ref={e => this.thumbnail = e}>
            <LazyImageComp src={`/cms-assets/${p.cover.asset_id}`} alt="Issue cover" clickable={true}/>

            {/* if we have a caption, and it has HTML markup in it, render it and skip truncation */}

            {p.cover.caption && (
              hasHTMLCaption ? (
                <figcaption className="c-issue__caption">
                  <span dangerouslySetInnerHTML={{ __html: `<i>Cover Caption:</i> ${p.cover.caption}`}}></span>
                </figcaption>
              ) : (
                <TruncationObj 
                  element="figcaption"
                  className="c-issue__caption"
                  expandable={true}
                  buttonClassName="c-issue__caption-truncate-more"
                >
                  <i>Cover Caption: {p.cover.caption}</i>
                </TruncationObj>
              )
            )}
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
