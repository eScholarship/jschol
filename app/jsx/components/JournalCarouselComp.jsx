// ##### Journal Carousel Component ##### //
import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import CarouselComp from '../components/CarouselComp.jsx'
import { Link } from 'react-router'
import MEDIA_PATH from '../../js/MediaPath.js'

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
    })).isRequired,
    item_count: PropTypes.number.isRequired,
    view_count: PropTypes.number.isRequired,
  }

  componentDidMount () {
    /* jquery dotdotdot */
    $('.o-journal2 figcaption').dotdotdot({
      watch: 'window'
    });
  }
  render() {
    let p = this.props
    let pluralItems = (p.item_count == 1) ? '' : 's'
    return (
      <div className="c-campuscarouselframe">
        <h2 className="c-campuscarouselframe__heading"><Link to={"/" + p.titleID + "/journals"}>{p.titleName} Journals</Link></h2>
        <div className="c-campuscarouselframe__carousel">
          <CarouselComp className="c-journalcarousel"
                        options={{
                          cellAlign: 'left',
                          initialIndex: 0,
                          pageDots: false,
                          imagesLoaded: true,
                          percentPosition: false // px instead of % cells
                        }}>
            {p.slides.map( u =>
              <div key={u.unit_id} className="c-journalcarousel__item">
                <a href={"/uc/" + u.unit_id} className="o-journal2">
                  <figure>
                  {u.cover ?
                    <img src={"/assets/"+u.cover.asset_id} alt={u.name}/>
                  : <img src="{MEDIA_PATH + ''}/temp_article.png" alt={u.name} /> }
                    <figcaption>{u.name}</figcaption>
                  </figure>
                </a>
              </div>
            )}
          </CarouselComp>
        </div>
        <div className="c-campuscarouselframe__stats">
          {p.item_count > 0 &&
            <div className="o-stat--item">
              <Link to={"/" + p.titleID + "/journals"}>{p.item_count.toLocaleString()}</Link>Item{pluralItems}
            </div>
          }
          {p.view_count > 0 &&
            <div className="o-stat--view">
              <b>{p.view_count.toLocaleString()}</b>Views
            </div>
          }
        </div>
      </div>
    )
  }
}

module.exports = JournalCarouselComp;
