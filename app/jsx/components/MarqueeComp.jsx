// ##### Carousel Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import AboutComp from "../components/AboutComp.jsx"

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

  // renders Marquee section, AND, if present, About section
  renderMarquee = slides => {
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
          <AboutComp about={this.props.marquee.about} lines={4} />
        </aside>
      }
      </div>
    )
  }


  render() {
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

    if (this.props.forceOn || (marquee.carousel && marquee.slides && marquee.slides.length > 0)) return this.renderMarquee(slides)
    if (((marquee.carousel && (!marquee.slides || marquee.slides.length == 0)) ||
         !marquee.carousel) && marquee.about) return <AboutComp about={marquee.about} />

  }
}

export default MarqueeComp;
