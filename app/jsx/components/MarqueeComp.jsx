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
        <div key="1" className="c-marquee__carousel-cell">
          <h2>Carousel Cell Title 1</h2>
          <p>Magnam praesentium sint, ducimus aspernatur architecto, deserunt ipsa veniam quia nihil, doloribus, laudantium a ad error tenetur fuga consequuntur laboriosam omnis ipsam.</p>
          <a href="" className="o-textlink__primary">More&hellip;</a>
        </div>,
        <div key="2" className="c-marquee__carousel-cell">
          <h2>Carousel Cell Title 2</h2>
          <p>Iure quod itaque maiores optio eveniet assumenda omnis, similique. Possimus, expedita, ea?</p>
          <a href="" className="o-textlink__primary">More&hellip;</a>
        </div>,
        <div key="3" className="c-marquee__carousel-cell">
          <h2>Carousel Cell Title 3</h2>
          <p>Obcaecati consequatur quaerat eaque, beatae eligendi possimus, repudiandae magni quas dolores, sit voluptatem iusto laborum. Incidunt fuga sed dicta nisi voluptates eaque, beatae numquam officia animi, vel.</p>
          <a href="" className="o-textlink__primary">More&hellip;</a>
        </div>
      ]
    }
    return (
      <div className="c-marquee">
        <div className="c-marquee__carousel">
          {carouselCells}
        </div>
        <aside className="c-marquee__sidebar">
          <section className="o-columnbox2">
            <header>
              <h2>About</h2>
            </header>
            {/* FIXME: ask Joel to specify the height so we don't have to manually config it below. */}
            <div ref={ el => $(el).dotdotdot({watch:"window", height:150}) }>
              <p>{this.props.marquee.about}</p>
            </div>
          </section>
        </aside>
      </div>
    )
  }
}

module.exports = MarqueeComp;
