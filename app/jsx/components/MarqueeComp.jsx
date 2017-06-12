// ##### Carousel Component ##### //

import React from 'react'
import CarouselComp from '../components/CarouselComp.jsx'
import { Link } from 'react-router'

class MarqueeComp extends React.Component {
  render() {
    return (
      <div className="c-marquee">
        { this.props.marquee.carousel &&
          <CarouselComp className="c-marquee__carousel" options={{
              cellAlign: 'left',
              contain: true,
              initialIndex: 0,
              imagesLoaded: true
            }}>
            <div className="c-marquee__carousel-cell" style={{backgroundImage: "url('https://static.pexels.com/photos/27714/pexels-photo-27714.jpg')"}}>
               <h2>Carousel Cell Title 1</h2>
              <p>Magnam praesentium sint, ducimus aspernatur architecto, deserunt ipsa veniam quia nihil, doloribus, laudantium a ad error tenetur fuga consequuntur laboriosam omnis ipsam.</p>
              <a href="">More&hellip;</a>
            </div>
            <div className="c-marquee__carousel-cell" style={{backgroundImage: "url('https://static.pexels.com/photos/40797/wild-flowers-flowers-plant-macro-40797.jpeg')"}}>
              <h2>Carousel Cell Title 2</h2>
              <p>Iure quod itaque maiores optio eveniet assumenda omnis, similique. Possimus, expedita, ea?</p>
              <a href="">More&hellip;</a>
            </div>
            <div className="c-marquee__carousel-cell" style={{backgroundImage: "url('http://www.almanac.com/sites/default/files/birth_month_flowers-primary-1920x1280px_pixabay.jpg')"}}>
              <h2>Carousel Cell Title 3</h2>
              <p>Obcaecati consequatur quaerat eaque, beatae eligendi possimus, repudiandae magni quas dolores, sit voluptatem iusto laborum. Incidunt fuga sed dicta nisi voluptates eaque, beatae numquam officia animi, vel.</p>
              <a href="">More&hellip;</a>
            </div>
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
