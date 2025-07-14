// ##### About (standalone) Component ##### //

import React from 'react'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import $ from 'jquery'

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
          <h2>About</h2>
        </header>
        <div className="o-columnbox__truncate1" ref={element => this.aboutElement = element} >
          <ArbitraryHTMLComp html={about_block} h1Level={3}/>
        </div>
      </section>
    )

  }
}

export default AboutComp;
