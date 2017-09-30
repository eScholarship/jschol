import React from 'react'
import PropTypes from 'prop-types'
import CampusSearchComp from '../components/CampusSearchComp.jsx'
import HeatMapComp from '../components/HeatMapComp.jsx'
import StatCarouselComp from '../components/StatCarouselComp.jsx'
import UnitCarouselComp from '../components/UnitCarouselComp.jsx'
import JournalCarouselComp from '../components/JournalCarouselComp.jsx'
import NotYetLink from '../components/NotYetLink.jsx'
import { Link } from 'react-router'

class CampusLayout extends React.Component {
  static propTypes = {
    data:  PropTypes.shape({
      contentCar1: PropTypes.shape({
        mode: PropTypes.string,
        data:  PropTypes.shape({
          unit_id: PropTypes.string,
          name: PropTypes.string,
          cover: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number,
            asset_id: PropTypes.string,
          }),
        }),
      }),
   // contentCar2: // Same as above
      journal_count: PropTypes.number,
      opened_count: PropTypes.number,
      pub_count: PropTypes.number,
      unit_count: PropTypes.number,
      view_count: PropTypes.number
    })
  }

  renderCampusCarousel(contentCarousel) {
    if (contentCarousel.mode == 'journals') return (
      <JournalCarouselComp campusID={this.props.unit.id} />
    )
    if (contentCarousel.mode == 'unit') return (
      <UnitCarouselComp unitID={contentCarousel.unit_id} />
    )
  }

  render() {
    let data = this.props.data,
        unit = this.props.unit
    return (
      <div>
        <HeatMapComp campusID={unit.id} />
        <StatCarouselComp campusName={unit.name} />
        <div className="c-columns">
          <main id="maincontent">
            <CampusSearchComp campusID={unit.id} campusName={unit.name} />
         {data.contentCar1 && data.contentCar1.mode && data.contentCar1.mode != 'disabled' && data.contentCar1.data &&
            this.renderCampusCarousel(data.contentCar1)
         }
         {data.contentCar2 && data.contentCar2.mode && data.contentCar2.mode != 'disabled' && data.contentCar2.data &&
            this.renderCampusCarousel(data.contentCar2)
         }
          </main>
          <aside>
            {this.props.sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = CampusLayout
