// ##### Unit Carousel Component ##### //
import React from 'react'
import $ from 'jquery'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'
import { Link } from 'react-router'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function genreToClassName(genre) {
  if      (genre == 'article')         return 'article'
  else if (genre == 'monograph')       return 'book'
  else if (genre == 'dissertation' ||
           genre == 'etd')             return 'thesis'
  else if (genre == 'multimedia')      return 'multimedia'
  else                                 return 'article'
}

class UnitCarouselItem extends React.Component {
  static propTypes = {
    result:  PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      authors: PropTypes.array,
      genre: PropTypes.string,
    }).isRequired
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
      <div className="c-unitcarousel__item">
        <h3>
          <a href={itemLink}>
            <ArbitraryHTMLComp html={pr.title}/>
          </a>
        </h3>
        {authorList &&
          <div className="c-unitcarousel__item-authorlist">
            <div className="c-authorlist">
              <ul className="c-authorlist__list">
                {authorList}
              </ul>
            </div>
          </div>
        }
        <div className={`c-unitcarousel__item-type--${genreToClassName(pr.genre)}`}>{capitalize(pr.genre)}</div>
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
    })).isRequired,
    item_count: PropTypes.number.isRequired,
    view_count: PropTypes.number.isRequired,
  }

  scrollDown = ()=> {
    this.scrollBox.scrollBy({ top: 100, behavior: 'smooth' });
    this.scrollBox.focus()
  }

  scrollUp = ()=> {
    this.scrollBox.scrollBy({ top: -100, behavior: 'smooth' });
    this.scrollBox.focus()
  }

  render() {
    let p = this.props
    let pluralItems = (p.item_count == 1) ? '' : 's'
    return (
      <div className="c-campuscarouselframe">
        <h2 className="c-campuscarouselframe__heading"><Link to={"/uc/"+p.titleID}>{p.titleName}</Link></h2>
        <div className="c-campuscarouselframe__carousel">
          <div className="c-unitcarousel">
            <button className="c-unitcarousel__button-up" onClick={this.scrollUp} aria-label="Scroll Up"></button>
            <div className="c-unitcarousel__scrollbox" ref={el => this.scrollBox = el} tabIndex="-1">
              { p.slides.map((result, i) =>
                <UnitCarouselItem key={i} result={result} orientation="horz" />)
              }
            </div>
            <button className="c-unitcarousel__button-down" onClick={this.scrollDown} aria-label="Scroll Down"></button>
          </div>
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

module.exports = UnitCarouselComp;
