// ##### Issue Component ##### //

import React from "react"
import LazyImageComp from "../components/LazyImageComp.jsx"
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import TruncationObj from "../objects/TruncationObj.jsx"

function IssueComp({ title, cover, description }) {
  const hasHTMLCaption = cover?.caption && /<[a-z][\s\S]*>/i.test(cover.caption)

  return (
    <div className="c-issue">
      {cover &&
        <figure className="c-issue__thumbnail">
          <LazyImageComp src={`/cms-assets/${cover.asset_id}`} alt="Issue cover" clickable={true}/>
        </figure>
      }
      <div className="c-issue__content">
        {title &&
          <h3 dangerouslySetInnerHTML={{__html: title}}></h3>
        }
        {description &&
          <div className="c-issue__description">
            <ArbitraryHTMLComp html={description} h1Level={3}/>
          </div>
        }
        {/* if we have a caption, and it has HTML markup in it, render it and skip truncation */}
        {cover?.caption && (
          hasHTMLCaption ? (
            <figcaption className="c-issue__caption">
              <span dangerouslySetInnerHTML={{ __html: `<i>Cover Caption:</i> ${cover.caption}`}}></span>
            </figcaption>
          ) : (
            <TruncationObj 
              element="figcaption"
              className="c-issue__caption"
              expandable={true}
              buttonClassName="c-issue__caption-truncate-more"
            >
              <i>Cover Caption: {cover.caption}</i>
            </TruncationObj>
          )
        )}
      </div>
    </div>
  )
}

export default IssueComp;
