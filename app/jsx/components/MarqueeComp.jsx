// ##### Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import { Subscriber } from 'react-broadcast'


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
  
  componentWillReceiveProps(newProps) {
    if (newProps.editing) {
      var newClassNames = $($('.c-marquee__carousel')[0]).attr('class') + " editable-outline";
      $($('.c-marquee__carousel')[0]).attr('class', newClassNames);
    } else {
      var oldClassNames = $($('.c-marquee__carousel')[0]).attr('class')
      oldClassNames = oldClassNames.replace('editable-outline', '');
      $($('.c-marquee__carousel')[0]).attr('class', oldClassNames);      
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
      <Subscriber channel="cms">
        { cms => 
          <div className="c-marquee">
            <div className="c-marquee__carousel" style={cms.isEditingPage ? {border: '1px solid red'} : {}}>
              {carouselCells}
            </div>
            <div className="c-marquee__sidebar">
              <section className="o-columnbox4">
                <header>
                  <h2 className="o-columnbox2__heading">About</h2>
                </header>
                <p className={cms.isEditingPage && "editable-outline"}>{this.props.marquee.about} <a className="o-textlink__secondary" href="">More</a>
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
