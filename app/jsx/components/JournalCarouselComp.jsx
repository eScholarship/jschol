// ##### Journal Carousel Component ##### //
import React from 'react'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'
import TruncationObj from '../objects/TruncationObj.jsx'
import { Link } from 'react-router-dom'
import MEDIA_PATH from '../../js/MediaPath.js'

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
                    <img src={"/cms-assets/"+u.cover.asset_id} alt={u.name}/>
                  : <img src={MEDIA_PATH + '/temp_article.png'} alt={u.name} /> }
                    <TruncationObj element="figcaption" lines={2}>{u.name}</TruncationObj>
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

export default JournalCarouselComp;
