// ##### About (standalone) Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class AboutComp extends React.Component {
  componentDidMount() {
    if (this.aboutElement) {
      $(this.aboutElement).dotdotdot({
        watch: 'window',
        after: '.c-marquee__sidebar-more',
        callback: ()=> {
          $(this.aboutElement).find(".c-marquee__sidebar-more").click(this.destroydotdotdot)
        }
      })
      setTimeout(()=> $(this.aboutElement).trigger('update'), 0) // removes 'more' link upon page load if less than truncation threshold
    }
  }

  destroydotdotdot = event => {
    $(this.aboutElement).trigger('destroy')
    $(this.aboutElement).removeClass("o-columnbox__truncate1")
    $(this.aboutElement).find(".c-marquee__sidebar-more").hide()
  }

  render() {
    let about_block = this.props.about ?
      ("<div>" + this.props.about + "</div>" +
       "<button class=\"c-marquee__sidebar-more\">More</button>") : null
    return (
      <section className="o-columnbox2">
        <header>
          <h1>About</h1>
        </header>
        <div className="o-columnbox__truncate1" ref={element => this.aboutElement = element}
               dangerouslySetInnerHTML={{__html: about_block}} />
      </section>
    )

  }
}

module.exports = AboutComp;
