// ##### Issue Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"

class IssueComp extends React.Component {
  state = {
    isExpanded: false
  }

  toggleExpanded = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }))
  }

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
    const truncateClass = this.state.isExpanded ? '' : 'u-truncate-lines'
    
    return (
      <div className="c-issue">
      {p.title &&
        <h3 ref={e => this.title = e} dangerouslySetInnerHTML={{__html: p.title}}></h3>
      }
      {p.cover &&
        <figure className="c-issue__thumbnail" ref={e => this.thumbnail = e}>
          <LazyImageComp src={"/cms-assets/"+p.cover.asset_id} alt="Issue cover" clickable={true}/>

          {/* if we have a caption, and it has HTML markup in it, render it and skip truncation */}

          {p.cover.caption && (
            /<[a-z][\s\S]*>/i.test(p.cover.caption) ? (
              <figcaption className="c-issue__caption" ref={e => this.caption = e}>
                <div>
                  <i>Cover Caption:</i> 
                  <span dangerouslySetInnerHTML={{__html: p.cover.caption}}></span> 
                </div>
              </figcaption>
          ) : (
              <figcaption className={`c-issue__caption c-issue__caption-truncate ${truncateClass}`} ref={e => this.caption = e}>
                <div>
                  <i>Cover Caption:</i> 
                  <span>{p.cover.caption}</span> 
                </div>
              </figcaption>
        )
      )}
        </figure>
      }
      {p.description &&
        <div className="c-issue__description" ref={e => this.descr = e}>
          <ArbitraryHTMLComp html={p.description} h1Level={3}/>
        </div>
      }
      {p.cover && p.cover.caption && !/<[a-z][\s\S]*>/i.test(p.cover.caption) && (
        <button 
          className="c-issue__caption-truncate-more" 
          onClick={this.toggleExpanded}
          style={{ display: this.state.isExpanded ? 'none' : 'block' }}
        >
          {this.state.isExpanded ? 'Less' : 'More'}
        </button>
      )}
      </div>
    )
  }
}

export default IssueComp;
