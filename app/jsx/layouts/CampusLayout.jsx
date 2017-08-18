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
  }

  // ToDo: This URL should be an attr on the entity that's configured on the campus CMS page
  dashUrlList = {
    'ucb': 'https://dash.berkeley.edu/stash',
    'uci': 'https://dash.lib.uci.edu/stash',
    'ucm': 'https://dash.ucmerced.edu/stash',
    'ucop': 'https://dash.ucop.edu/stash',
    'ucr': 'https://dash.ucr.edu/stash',
    'ucsc': 'https://dash.library.ucsc.edu/stash',
    'ucsf': 'https://datashare.ucsf.edu/stash',
  }

  render() {
    let data = this.props.data,
        unit = this.props.unit,
        dash = Object.keys(this.dashUrlList).includes(unit.id),
        dashUrl = dash ? this.dashUrlList[unit.id] : null

    return (
      <div>
        <HeatMapComp campusID={unit.id} />
        <StatCarouselComp campusName={unit.name} />
        <div className="c-columns">
          <main id="maincontent">
            <CampusSearchComp campusID={unit.id} campusName={unit.name} />
            <UnitCarouselComp campusID={unit.id} campusName={unit.name} />
            <JournalCarouselComp campusID={unit.id} campusName={unit.name} />
          </main>
          <aside>
            <section className="o-columnbox1">
              <header>
                <h2>Campus Contact</h2>
              </header>
              <p><NotYetLink className="o-textlink__secondary" element="a">Sam Smith</NotYetLink>
                <br/>Scholarly Communication Officer,
                <br/>University of California
                <br/>415 20th Street
                <br/>Oakland, CA 94612
                <br/>(555) 555-4444
              </p>
            </section>
          {dashUrl &&
            <section className="o-columnbox1">
              <header>
                <h2>{unit.name} Datasets</h2>
              </header>
              To publish the data that accompanies your research, <a href={dashUrl}>visit {unit.name} Dash</a>.
            </section>
          }
            <section className="o-columnbox1">
              <header>
                <h2>Follow Us On Twitter</h2>
              </header>
              [content to go here]
            </section>
            {this.props.sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = CampusLayout
