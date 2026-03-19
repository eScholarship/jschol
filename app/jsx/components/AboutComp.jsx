// ##### About (standalone) Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import TruncationObj from "../objects/TruncationObj.jsx"

class AboutComp extends React.Component {
  static propTypes = {
    about: PropTypes.string,
    lines: PropTypes.number,
  }

  static defaultProps = {
    lines: null
  }

  render() {
    const { about, lines } = this.props
    const about_block = about && `<div>${about}</div>`

    return (
      <section className="o-columnbox2">
        <header>
          <h2>About</h2>
        </header>
        <TruncationObj 
          element="div" 
          className="o-columnbox"
          lines={lines}
          expandable={true}
        >
          <ArbitraryHTMLComp html={about_block} h1Level={3}/>
        </TruncationObj>
      </section>
    )
  }
}

export default AboutComp;
