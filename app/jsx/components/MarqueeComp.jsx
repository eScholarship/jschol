// ##### Carousel Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import $ from 'jquery'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class MarqueeComp extends React.Component {
  static propTypes = {
    forceOn: PropTypes.bool,
    marquee: PropTypes.shape({
      about: PropTypes.string,
      carousel: PropTypes.bool,
      slides: PropTypes.arrayOf(PropTypes.shape({
        header: PropTypes.string,
        image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        text: PropTypes.string,
        imagePreviewUrl: PropTypes.string
      }))
    })
  }

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
    $(this.aboutElement).removeClass("c-marquee__sidebar-truncate")
    $(this.aboutElement).removeClass("o-columnbox__truncate1")
    $(this.aboutElement).find(".c-marquee__sidebar-more").hide()
  }

  // renders Marquee section, AND, if present, About section
  renderMarquee = (slides, about_block) => {
    return (
      <div className="c-marquee">
        <CarouselComp className="c-marquee__carousel" 
          truncate=".c-marquee__carousel-cell"
          options={{
            cellAlign: 'left',
            contain: true,
            initialIndex: 0,
            imagesLoaded: true
          }}>
          {slides}
        </CarouselComp>
      {this.props.marquee.about &&
        <aside className="c-marquee__sidebar">
{/* ToDo: Itegrate AboutComp here, while observing necessary truncation behavior.
    For now, any changes here should also be reflected in AboutComp */}
          <section className="o-columnbox2">
            <header>
              <h2>About</h2>
            </header>
            <div className="c-marquee__sidebar-truncate" ref={element => this.aboutElement = element}>
              <ArbitraryHTMLComp html={about_block} h1Level={3}/>
            </div>
          </section>
        </aside>
      }
      </div>
    )
  }

  // ToDo: Itegrate AboutComp here, while observing necessary truncation behavior.
  //  For now, any changes here should also be reflected in AboutComp
  renderAbout = (about_block) => {
    return (
      <section className="o-columnbox2">
        <header>
          <h2>About</h2>
        </header>
        <div className="o-columnbox__truncate1" ref={element => this.aboutElement = element}>
          <ArbitraryHTMLComp html={about_block} h1Level={3}/>
        </div>
      </section>
    )
  }

  render() {
    let about_block = this.props.marquee.about ?
      ("<div>" + this.props.marquee.about + "</div>" +
       "<button class=\"c-marquee__sidebar-more\">More</button>") : null
    let marquee = this.props.marquee
    var slides = []
    if (marquee.slides) {
      // console.log(this.props.marquee.slides)
      slides = this.props.marquee.slides.map((slide, i) => {
        var imgUrl
        if (slide.imagePreviewUrl) {
          imgUrl = slide.imagePreviewUrl
          //for testing - amy used image urls in slide.image before she got upload working
          //seems useful so keeping this logic here
        } else if (slide.image && typeof slide.image === "string") {
          imgUrl = slide.image
        } else if (slide.image && slide.image.asset_id) {
          imgUrl = "/cms-assets/" + slide.image.asset_id
        } else {
          imgUrl = ""
        }

        return (
          <div key={i} className="c-marquee__carousel-cell" style={{backgroundImage: "url('" + imgUrl + "')"}}>
            <h2>{slide.header}</h2>
            {slide.text && <ArbitraryHTMLComp html={slide.text} h1Level={3}/> }
          </div>
        )
      })
    }

    if (this.props.forceOn || (marquee.carousel && marquee.slides && marquee.slides.length > 0)) return this.renderMarquee(slides, about_block)
    if (((marquee.carousel && (!marquee.slides || marquee.slides.length == 0)) ||
         !marquee.carousel) && marquee.about) return this.renderAbout(about_block)

  }
}

export default MarqueeComp;
