// ##### Carousel Component ##### //

import React from 'react'
import CarouselComp from '../components/CarouselComp.jsx'
import $ from 'jquery'
import { Link } from 'react-router'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class MarqueeComp extends React.Component {
  componentDidMount() {
    $('.o-columnbox__truncate1, .o-columnbox__truncate2').dotdotdot({
      watch: 'window',
      after: '.o-columnbox__truncate-more-link'
    });
    setTimeout(()=> $('.o-columnbox__truncate1').trigger('update'), 0) // removes 'more' link upon page load if less than truncation threshold
    $('.c-marquee__carousel-cell').dotdotdot({
      watch: 'window',
      after: '.c-marquee__sidebar-more-link'
    });
  }

  render() {
    let about_block = this.props.marquee.about ?
      <p dangerouslySetInnerHTML={{__html: this.props.marquee.about}}/>
      : null
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
              <p>Totam iusto vero, omnis ut modi, possimus fugiat consequuntur incidunt eius delectus, enim commodi dicta itaque! Dolores quis natus itaque delectus fuga. Id debitis, corporis, suscipit placeat architecto doloremque reprehenderit deleniti in iure assumenda cum dignissimos sit! Exercitationem reiciendis quas voluptatibus tempora.</p>
              <a className="c-marquee__sidebar-more-link" href="">More</a>
            </div>
            <div className="c-marquee__carousel-cell" style={{backgroundImage: "url('https://static.pexels.com/photos/40797/wild-flowers-flowers-plant-macro-40797.jpeg')"}}>
              <h2>Carousel Cell Title 2</h2>
              <p>Iure quod itaque maiores optio eveniet assumenda omnis, similique. Possimus, expedita, ea?</p>
            </div>
            <div className="c-marquee__carousel-cell" style={{backgroundImage: "url('http://www.almanac.com/sites/default/files/birth_month_flowers-primary-1920x1280px_pixabay.jpg')"}}>
              <h2>Carousel Cell Title 3</h2>
              <p>Obcaecati consequatur quaerat eaque, beatae eligendi possimus, repudiandae magni quas dolores, sit voluptatem iusto laborum. Incidunt fuga sed dicta nisi voluptates eaque, beatae numquam officia animi, vel.</p>
            </div>
          </CarouselComp>
        }
        { this.props.marquee.carousel && this.props.marquee.about &&
          <aside className="c-marquee__sidebar">
            <section className="o-columnbox2">
              <header>
                <h2>About</h2>
              </header>
              <div className="o-columnbox__truncate2">
                {about_block} 
              </div>
            </section>
          </aside>
        }
        { !this.props.marquee.carousel && this.props.marquee.about &&
          <section className="o-columnbox2">
            <header>
              <h2>About</h2>
            </header>
            <div className="o-columnbox__truncate1">
              {about_block} 
            </div>
          </section>
        }
      </div>
    )
  }
}

module.exports = MarqueeComp;
