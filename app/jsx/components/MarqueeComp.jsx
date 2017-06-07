// ##### Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'

// Only load flickity when in the browser (not server-side)
if (!(typeof document === "undefined")) {
  var Flickity = require('flickity-imagesloaded')
  const dotdotdot = require('jquery.dotdotdot')
}

class MarqueeComp extends React.Component {
  componentDidMount () {
    if (this.props.marquee.carousel) {
      var carousel = $('.c-marquee__carousel')[0];
      var options = {
        cellAlign: 'left',
        contain: true,
        initialIndex: 0,
        imagesLoaded: true
      }
      this.flkty = new Flickity(carousel, options);
      $(".c-marquee__carousel-cell").css('visibility', 'visible')
    }
  }

  componentWillUnmount() {
    if (this.flkty) {
      this.flkty.destroy();
    }
  }
  render() {
    var carouselCells;
    if (this.props.marquee.carousel) {
      carouselCells = [
        <div key="1" className="c-marquee__carousel-cell" style={{backgroundImage: "url('https://static.pexels.com/photos/27714/pexels-photo-27714.jpg')"}}>
           <h2>Carousel Cell Title 1</h2>
          <p>Magnam praesentium sint, ducimus aspernatur architecto, deserunt ipsa veniam quia nihil, doloribus, laudantium a ad error tenetur fuga consequuntur laboriosam omnis ipsam.</p>
          <a href="">More&hellip;</a>
        </div>,
        <div key="2" className="c-marquee__carousel-cell" style={{visibility: "hidden", backgroundImage: "url('https://static.pexels.com/photos/40797/wild-flowers-flowers-plant-macro-40797.jpeg')"}}>
          <h2>Carousel Cell Title 2</h2>
          <p>Iure quod itaque maiores optio eveniet assumenda omnis, similique. Possimus, expedita, ea?</p>
          <a href="">More&hellip;</a>
        </div>,
        <div key="3" className="c-marquee__carousel-cell" style={{visibility: "hidden", backgroundImage: "url('http://www.almanac.com/sites/default/files/birth_month_flowers-primary-1920x1280px_pixabay.jpg')"}}>
          <h2>Carousel Cell Title 3</h2>
          <p>Obcaecati consequatur quaerat eaque, beatae eligendi possimus, repudiandae magni quas dolores, sit voluptatem iusto laborum. Incidunt fuga sed dicta nisi voluptates eaque, beatae numquam officia animi, vel.</p>
          <a href="">More&hellip;</a>
        </div>
      ]
    }
    return (
      <div className="c-marquee">
        <div className="c-marquee__carousel">
          {carouselCells}
        </div>
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
