// ##### Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import Flickity from 'flickity-imagesloaded'

class CarouselComp extends React.Component {
  componentDidMount () {
    var carousel = $('.c-carousel__object')[0];
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
      <div className="c-carousel">
        <section className="c-carousel__textblock o-columnbox4">
          <header>
            <h2 className="o-columnbox2__heading">About</h2>
          </header>
          <p>Quo dolores unde alias, distinctio rem reprehenderit adipisci officiis eum facilis sunt, vero obcaecati qui porro, sed mollitia consequuntur, aperiam quaerat. <a className="o-textlink__secondary" href="">More</a>
          </p>
        </section>
        <div className="c-carousel__object">
          <img src="http://placehold.it/300x150?text=Image" alt="" className="c-columndivide__img"/>
          <img src="http://placehold.it/300x150?text=Image" alt="" className="c-columndivide__img"/>
          <img src="http://placehold.it/300x150?text=Image" alt="" className="c-columndivide__img"/>
          <img src="http://placehold.it/300x150?text=Image" alt="" className="c-columndivide__img"/>
          <img src="http://placehold.it/300x150?text=Image" alt="" className="c-columndivide__img"/>
        </div>
      </div>
    )
  }
}

module.exports = CarouselComp;
