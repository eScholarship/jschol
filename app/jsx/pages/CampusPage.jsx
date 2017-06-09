// ##### Campus Page ##### // 
// Temporary until UNIT-CONTENT refactoring is complete // 

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import CampusSearchComp from '../components/CampusSearchComp.jsx'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import HeatMapComp from '../components/HeatMapComp.jsx'
import CampusCarouselComp from '../components/CampusCarouselComp.jsx'

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
        dashUrl = dash ? this.dashUrlList[data.header.campusID] : null
    return (
      <div>
        <Header2Comp type="campus" unitID={data.header.campusID} /> 
        <Subheader2Comp unit={data.unit}
                        campusID={data.header.campusID}
                        campusName={data.header.campusName}
                        campuses={data.header.campuses} />
        <div className="c-navbar">
          {/* ToDo: Properly call header.nav_bar */}
          <NavComp data={[{name: 'Open Access Policies', slug: ''}, {name: 'Journals', slug: '/' + data.campusID + '/journals'}, {name: 'Academic Units', slug: '/' + data.campusID + '/units'}]} />
        </div>
        <HeatMapComp />
        <CampusCarouselComp campusName={data.header.campusName} />
        <div className="c-columns">
          <main id="maincontent">
            <CampusSearchComp campusName={data.header.campusName} dashUrl={dashUrl} />
            <section className="o-columnbox1">
              [collections section to go here]
            </section>
            <section className="o-columnbox1">
              [journal section to go here]
            </section>
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
