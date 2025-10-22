// ##### About (standalone) Component ##### //

import React from 'react'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import TruncationObj from "../objects/TruncationObj.jsx"

class AboutComp extends React.Component {
  render() {
    let about_block = this.props.about ?
      ("<div>" + this.props.about + "</div>") : null
    
    return (
      <section className="o-columnbox2">
        <header>
          <h2>About</h2>
        </header>
        <TruncationObj element="div" className="o-columnbox" expandable={true}>
          <ArbitraryHTMLComp html={about_block} h1Level={3}/>
        </TruncationObj>
      </section>
    )
  }
}

export default AboutComp;
