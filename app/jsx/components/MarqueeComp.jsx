// ##### Carousel Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'
import { Link } from 'react-router'

class MarqueeComp extends React.Component {
  static propTypes = {
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      extent: PropTypes.object
    }).isRequired,
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

  render() {
    var slides = []
    if (this.props.marquee.slides) {
      slides = this.props.marquee.slides.map((slide, i) => {
        var imgUrl
        if (slide.imagePreviewUrl) {
          imgUrl = slide.imagePreviewUrl
        } else if (slide.image && typeof slide.image === "string") {
          imgUrl = slide.image
        } else if (slide.image && slide.image.asset_id) {
          imgUrl = "/assets/" + slide.image.asset_id
        } else {
          imgUrl = ""
        }

        return (
          <div key={i} className="c-marquee__carousel-cell" style={{backgroundImage: "url('" + imgUrl + "')"}}>
            <h2>{slide.header}</h2>
            <p>{slide.text}</p>
            <a href="">More&hellip;</a>
          </div>
        )
      })
    }

    return (
      <div className="c-marquee">
        { this.props.marquee.carousel && this.props.marquee.slides &&
          <CarouselComp className="c-marquee__carousel" options={{
              cellAlign: 'left',
              contain: true,
              initialIndex: 0,
              imagesLoaded: true
            }}>
            {slides}
          </CarouselComp>
        }
        { this.props.marquee.about &&
          <aside className="c-marquee__sidebar">
            <section className="o-columnbox2">
              <header>
                <h2>About</h2>
              </header>
              <p dangerouslySetInnerHTML={{__html: this.props.marquee.about}}/>
            </section>
          </aside>
        }
      </div>
    )
  }
}

module.exports = MarqueeComp;
