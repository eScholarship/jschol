// ##### Journal Carousel Component ##### //
import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import CarouselComp from '../components/CarouselComp.jsx'
import { Link } from 'react-router'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class JournalCarouselComp extends React.Component {
  static propTypes = {
    titleID: PropTypes.string.isRequired,    // campus ID
    titleName: PropTypes.string.isRequired,  // campus Name
    slides:  PropTypes.arrayOf(PropTypes.shape({
      unit_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      cover: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        asset_id: PropTypes.string,
      }),
    })).isRequired
  }

  componentDidMount () {
    /* jquery dotdotdot */
    $('.o-journal2 figcaption').dotdotdot({
      watch: 'window'
    });
  }
  render() {
    let p = this.props
    return (
      <div className="o-itemcarousel">
        <h2 className="o-itemcarousel__heading"><Link to={"/" + p.titleID + "/journals"}>{p.titleName} Journals</Link></h2>
        <CarouselComp className="c-journalcarousel o-itemcarousel__carousel" 
                      options={{
                        cellAlign: 'left',
                        initialIndex: 0,
                        pageDots: false,
                        imagesLoaded: true,
                        percentPosition: false // px instead of % cells
                      }}>
        {p.slides.map( u =>
          <div key={u.unit_id} className="o-itemcarousel__item">
          <a href={"/uc/" + u.unit_id} className="o-journal2">
            <figure>
            {u.cover ?
              <img src={"/assets/"+u.cover.asset_id} alt={u.name}/>
            : <img src="/images/temp_article.png" alt={u.name} /> }
              <figcaption>{u.name}</figcaption>
            </figure>
          </a>
        </div>
        )}
        </CarouselComp>
        <div className="o-stat--item o-itemcarousel__stats-item">
          <Link to={"/" + p.titleID + "/journals"}>9,999</Link>Items
        </div>
        <div className="o-stat--view o-itemcarousel__stats-view">
          <b>999,999</b>Views
        </div>
      </div>
    )
  }
}

module.exports = JournalCarouselComp;
