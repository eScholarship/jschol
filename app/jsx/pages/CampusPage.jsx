// ##### Campus Page ##### // 
// Temporary until UNIT-CONTENT refactoring is complete // 

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import CampusSearchComp from '../components/CampusSearchComp.jsx'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import HeatMapComp from '../components/HeatMapComp.jsx'
import StatCarouselComp from '../components/StatCarouselComp.jsx'
import UnitCarouselComp from '../components/UnitCarouselComp.jsx'
import JournalCarouselComp from '../components/JournalCarouselComp.jsx'

class CampusPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/unit/" + this.props.route.path.split('/')[2] + "/campus_landing"
  }

  dashUrlList = {
    'ucb': 'https://dash.berkeley.edu/stash',
    'uci': 'https://dash.lib.uci.edu/stash',
    'ucm': 'https://dash.ucmerced.edu/stash',
    'ucop': 'https://dash.ucop.edu/stash',
    'ucr': 'https://dash.ucr.edu/stash',
    'ucsc': 'https://dash.library.ucsc.edu/stash',
    'ucsf': 'https://datashare.ucsf.edu/stash',
  }

  renderData(data) {
    let dash = Object.keys(this.dashUrlList).includes(data.header.campusID),
        dashUrl = dash ? this.dashUrlList[data.header.campusID] : null,
        logo = data.header.logo ? data.header.logo
          : { url: "http://placehold.it/400x100?text="+data.unit.id, width: 400, height: 100 }
    return (
      <div>
        <Header2Comp type="campus" unitID={data.header.campusID} /> 
        <SubheaderComp unit={data.unit} logo={data.header.logo}
                                        campusID={data.header.campusID}
                                        campusName={data.header.campusName}
                                        campuses={data.header.campuses} />
        <NavBarComp
          // ToDo: Properly call header.nav_bar
          // navBar={data.header.nav_bar}
          navBar={[{id: 1, name: 'Open Access Policies', url: ''}, {id: 2, name: 'Journals', url: '/' + data.header.campusID + '/journals'}, {id: 3, name: 'Academic Units', url: '/' + data.header.campusID + '/units'}]}
          unit={data.unit} socialProps={data.header.social} />
        <HeatMapComp />
        <StatCarouselComp campusName={data.header.campusName} />
        <div className="c-columns">
          <main id="maincontent">
            <CampusSearchComp campusID={data.header.campusID} campusName={data.header.campusName} dashUrl={dashUrl} />
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
              To publish the data that accompanies your resarch, <a href={dashUrl}>visit {data.header.campusName} Dash</a>.
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

module.exports = CampusPage
