// ##### About (standalone) Component ##### //

import React from 'react'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class AboutComp extends React.Component {
  state = {
    isExpanded: false
  }

  toggleExpanded = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }))
  }

  render() {
    let about_block = this.props.about ?
      ("<div>" + this.props.about + "</div>") : null
    
    const truncateClass = this.state.isExpanded ? '' : 'u-truncate-lines'
    
    return (
      <section className="o-columnbox2">
        <header>
          <h2>About</h2>
        </header>
        <div className={`o-columnbox__truncate1 ${truncateClass}`} ref={element => this.aboutElement = element} >
          <ArbitraryHTMLComp html={about_block} h1Level={3}/>
        </div>
        {this.props.about && (
          <button 
            className="c-marquee__sidebar-more" 
            onClick={this.toggleExpanded}
            style={{ display: this.state.isExpanded ? 'none' : 'block' }}
          >
            {this.state.isExpanded ? 'Less' : 'More'}
          </button>
        )}
      </section>
    )
  }
}

export default AboutComp;
