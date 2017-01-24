// ##### Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import Flickity from 'flickity-imagesloaded'

class CarouselComp extends React.Component {
  componentDidMount () {
    var carousel = $('.c-marquee__carousel')[0];
    var options = {
      cellAlign: 'left',
      contain: true,
      initialIndex: 0,
      imagesLoaded: true
    }
    this.flkty = new Flickity(carousel, options);
  }
  componentWillUnmount() {
    if (this.flkty) {
      this.flkty.destroy();
    }
  }
  render() {
    return (
      <div className="c-marquee">
        <div className="c-marquee__carousel">
          <div className="c-marquee__carousel-cell">
            <h2>Carousel Cell Title 1</h2>
            <p>Magnam praesentium sint, ducimus aspernatur architecto, deserunt ipsa veniam quia nihil, doloribus, laudantium a ad error tenetur fuga consequuntur laboriosam omnis ipsam.</p>
            <a href="" className="o-textlink__primary">More&hellip;</a>
          </div>
          <div className="c-marquee__carousel-cell">
            <h2>Carousel Cell Title 2</h2>
            <p>Iure quod itaque maiores optio eveniet assumenda omnis, similique. Possimus, expedita, ea?</p>
            <a href="" className="o-textlink__primary">More&hellip;</a>
          </div>
          <div className="c-marquee__carousel-cell">
            <h2>Carousel Cell Title 3</h2>
            <p>Obcaecati consequatur quaerat eaque, beatae eligendi possimus, repudiandae magni quas dolores, sit voluptatem iusto laborum. Incidunt fuga sed dicta nisi voluptates eaque, beatae numquam officia animi, vel.</p>
            <a href="" className="o-textlink__primary">More&hellip;</a>
          </div>
        </div>
        <div className="c-marquee__sidebar">
          <section className="o-columnbox4">
            <header>
              <h2 className="o-columnbox2__heading">About</h2>
            </header>
            <p>Quo dolores unde alias, distinctio rem reprehenderit adipisci officiis eum facilis sunt, vero obcaecati qui porro, sed mollitia consequuntur, aperiam quaerat. <a className="o-textlink__secondary" href="">More</a>
            </p>
          </section>
        </div>
      </div>
    )
  }
}

module.exports = CarouselComp;
