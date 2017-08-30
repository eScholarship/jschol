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
    result: PropTypes.shape({
      id: PropTypes.string,
      genre: PropTypes.string,
      title: PropTypes.string,
      authors: PropTypes.array,
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
  componentDidMount () {
    /* jquery dotdotdot */
    $('.o-unititem__title, .o-unititem__author').dotdotdot({
      watch: 'window'
    });
  }
  render() {
    let dummyData = ([
{"id":"qt9v77h5zm","title":"Distinct configurations of protein complexes and biochemical pathways revealed by epistatic interaction network motifs","authors":[{"name":"Peet, Alison","fname":"Alison","lname":"Peet"},{"name":"Tyroler-Cooper, Samm","fname":"Samm","lname":"Tyroler-Cooper"},{"name":"Tsang, Daniel","email":"dtsang@uci.edu","fname":"Daniel","lname":"Tsang","institution":"UC Irvine"},{"name":"Liang, Wei","fname":"Wei","lname":"Liang","institution":"University of Southern California"}],"genre":"article"},
{"id":"qt9j48n0p8","title":"China’s contingencies and globalisation","authors":[{"name":"Nederveen Pieterse, J","email":"jnp@global.ucsb.edu","fname":"J","lname":"Nederveen Pieterse"}],"genre":"article"},
{"id":"qt5zt6n277","title":"Japan's China Strategy","authors":[{"name":"TAKAHASHI, Sugio","fname":"Sugio","lname":"TAKAHASHI"}],"genre":"article"},
{"id":"qt0zd563ks","title":"China’s Rise as a Global S&T Power and China–EU Cooperation","authors":[{"name":"Bräuner, Oliver","fname":"Oliver","lname":"Bräuner"}],"genre":"article"},
{"id":"qt0dk9k1rb","title":"How (and Why) to Do Business with China","authors":[{"name":"Tsang, Daniel","email":"dtsang@uci.edu","fname":"Daniel","lname":"Tsang","institution":"UC Irvine"}],"genre":"article"}
])

    return (
      <div className="o-itemcarousel">
        <h2 className="o-itemcarousel__heading"><Link to="/uc/crb">Center for Medieval and Renaissance Studies</Link></h2>
        <CarouselComp className="c-unitcarousel o-itemcarousel__carousel"
                      options={{
                        cellAlign: 'left',
                        initialIndex: 0,
                        pageDots: false,
                        percentPosition: false // px instead of % cells
                      }}>
          { dummyData.map((result, i) =>
            <UnitCarouselItem key={i} result={result} orientation={(i+1)%2 ? 'vert':'horz'} />)
          }
        </CarouselComp>
        <div className="o-stat--item o-itemcarousel__stats-item">
          <Link to="/uc/crb">9,999</Link>Items
        </div>
        <div className="o-stat--view o-itemcarousel__stats-view">
          <b>999,999</b>Views
        </div>
      </div>
    )
  }
}

module.exports = UnitCarouselComp;
