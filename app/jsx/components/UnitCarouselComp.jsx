// ##### Unit Carousel Component ##### //
import React from 'react'
import $ from 'jquery'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'
import { Link } from 'react-router'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class UnitCarouselItem extends React.Component {
  static propTypes = {
    result:  PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      authors: PropTypes.array,
      genre: PropTypes.string,
    }).isRequired,
    orientation: PropTypes.string.isRequired,
  }
  render() {
    let pr = this.props.result,
        itemLink = "/uc/item/"+pr.id.replace(/^qt/, "")
    let authorList
    if (pr.authors) {
      // Joel's CSS handles inserting semicolons here.
      authorList = pr.authors.map(function(author, i) {
        return (<li key={i}>{author.name}</li>)
      })
    }
    return (
      <div className="o-itemcarousel__item">
          <Link to={itemLink} className={"o-unititem--" + this.props.orientation}>
            <div className="o-unititem__type--article">{pr.genre}</div>
            <div className="o-unititem__title">{pr.title}</div>
          {authorList &&
            <ul className="o-unititem__author">
              {authorList}
            </ul>
          }
          </Link>
        </div>
    )
  }
}

class UnitCarouselComp extends React.Component {
  static propTypes = {
    titleID: PropTypes.string.isRequired,    // unit ID
    titleName: PropTypes.string.isRequired,  // unit Name
    slides:  PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      authors: PropTypes.array,
      genre: PropTypes.string,
    })).isRequired
  }

  componentDidMount () {
    /* jquery dotdotdot */
    $('.o-unititem__title, .o-unititem__author').dotdotdot({
      watch: 'window'
    });
  }
  render() {
    let p = this.props
    return (
      <div className="o-itemcarousel">
        <h2 className="o-itemcarousel__heading"><Link to={"/uc/"+p.titleID}>{p.titleName}</Link></h2>
        <CarouselComp className="c-unitcarousel o-itemcarousel__carousel"
                      options={{
                        cellAlign: 'left',
                        initialIndex: 0,
                        pageDots: false,
                        percentPosition: false // px instead of % cells
                      }}>
          { p.slides.map((result, i) =>
            <UnitCarouselItem key={i} result={result} orientation={(i+1)%2 ? 'vert':'horz'} />)
          }
        </CarouselComp>
        <div className="o-stat--item o-itemcarousel__stats-item">
          <Link to={"/uc/"+p.titleID}>9,999</Link>Items
        </div>
        <div className="o-stat--view o-itemcarousel__stats-view">
          <b>999,999</b>Views
        </div>
      </div>
    )
  }
}

module.exports = UnitCarouselComp;
