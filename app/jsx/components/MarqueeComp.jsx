// ##### Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import { Subscriber } from 'react-broadcast'
import { Link } from 'react-router'


// Only load flickity when in the browser (not server-side)
if (!(typeof document === "undefined")) {
  var Flickity = require('flickity-imagesloaded')
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
    var carouselOverlay = (
      <div className="c-marquee__overlay">
        <Link to={"/unit/" + this.props.unit.id + "/profile/#marquee" }>
          <img src="/images/icon_gear-black.svg"/>
        </Link>
      </div>
    )
    return (
      <Subscriber channel="cms">
        { cms => 
          <div className="c-marquee">
            <div className="c-marquee__carousel-overlay-container">
              {cms.isEditingPage && carouselOverlay}
              <div className="c-marquee__carousel">
                {carouselCells}
              </div>
            </div>
            <div className="c-marquee__sidebar">
              <section className={cms.isEditingPage ? "o-columnbox4 editable-outline" : "o-columnbox4"}>
                <header>
                  <h2 className="o-columnbox2__heading">About</h2>
                </header>
                <p>{this.props.marquee.about} <a className="o-textlink__secondary" href="">More</a>
                </p>
              </section>
            </div>
          </div>
        }
      </Subscriber>
    )
  }
}

module.exports = MarqueeComp;
