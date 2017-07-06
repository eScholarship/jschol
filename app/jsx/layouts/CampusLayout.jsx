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
        <HeatMapComp />
        <StatCarouselComp campusName={unit.name} />
        <div className="c-columns">
          <main id="maincontent">
            <CampusSearchComp campusID={unit.id} campusName={unit.name} dashUrl={dashUrl} />
            <UnitCarouselComp />
            <JournalCarouselComp />
          </main>
          <aside>
            <section className="o-columnbox1">
              <header>
                <h2>Campus Contact</h2>
              </header>
              <a className="o-textlink__primary" href="">Rachael Samberg</a>
              <br/>Scholarly Communication Officer,
              <br/>University of California, Berkeley
              <br/>212/218 Doe Library
              <br/>UC Berkeley
              <br/>Berkeley, CA 94720-6000
              <br/>(510) 664-9815
            </section>
          {dashUrl &&
            <section className="o-columnbox1">
              <header>
                <h2>UC Berkeley Datasets</h2>
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
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = CampusLayout
