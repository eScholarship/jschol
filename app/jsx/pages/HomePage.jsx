// ##### Home ##### //

import React from 'react'
import PropTypes from 'prop-types'
import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import ScrollingAnchorComp from "../components/ScrollingAnchorComp.jsx"
import HeroComp from '../components/HeroComp.jsx'
import TeaserComp from '../components/TeaserComp.jsx'
import HomeSection1Comp from '../components/HomeSection1Comp.jsx'
import HomeSection2Comp from '../components/HomeSection2Comp.jsx'
import HomeSection3Comp from '../components/HomeSection3Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

class HomePage extends PageBase
{
  static propTypes = {
    hero_data: PropTypes.shape({
     unit_id: PropTypes.string.isRequired,
      unit_name: PropTypes.string.isRequired,
      hero: PropTypes.shape({
        url: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number
      })
    }),
    stats: PropTypes.shape({
      statsCountItems: PropTypes.number.isRequired,
      statsCountViews: PropTypes.number.isRequired,
      // statsCountOpenItems: PropTypes.number.isRequired,
      statsCountEscholJournals: PropTypes.number.isRequired,
      statsCountOrus: PropTypes.number.isRequired,
      statsCountArticles: PropTypes.number.isRequired,
      statsCountThesesDiss: PropTypes.number.isRequired,
      statsCountBooks: PropTypes.number.isRequired,
    })
  }

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/home"
  }

  getRandomHero (hero_data) {
    let withHeroData = hero_data.filter(h => h.hero)
    return withHeroData[Math.floor(Math.random() * withHeroData.length)]
  }

  changeAnchor = name => {
    // Set hash based on what was clicked.
    window.location.hash=name
  }

  renderData(data) { 
    return(
      <div>
        <MetaTagsComp title="eScholarship"/>
        <Header1Comp />
        <div className="c-navbar">
          <NavComp data={data.header.nav_bar} />
        </div>
        <HeroComp hero_data={this.getRandomHero(data.hero_data)} />
        <TeaserComp changeAnchor={this.changeAnchor} />
        <section className="c-homesection">
          <header>
            <h2>Why Open Access with eScholarship?</h2>
          </header>
          <HomeSection1Comp stats={data.stats} />
        </section>
        <ScrollingAnchorComp name="home_repository" />
        <section className="c-homesection">
          <header>
            <h2>eScholarship is the institutional repository for the UC system</h2>
          </header>
          <HomeSection2Comp stats={data.stats} campuses={data.header.campuses} />
        </section>
        <ScrollingAnchorComp name="home_publishing" />
        <section className="c-homesection">
          <header>
            <h2>eScholarship is also an open access publishing platform</h2>
          </header>
          <HomeSection3Comp />
        </section>
      </div>
    )
  }
}

module.exports = HomePage;
