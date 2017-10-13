// ##### Home ##### //

import React from 'react'
import PropTypes from 'prop-types'
import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import HeroComp from '../components/HeroComp.jsx'
import TeaserComp from '../components/TeaserComp.jsx'
import HomeSection1Comp from '../components/HomeSection1Comp.jsx'
import HomeSection2Comp from '../components/HomeSection2Comp.jsx'
import HomeSection3Comp from '../components/HomeSection3Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

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
    })
  }

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/home"
  }

  pagePermissionsUnit() {
    return "root"
  }

  getRandomHero (hero_data) {
    let withHeroData = hero_data.filter(h => h.hero)
    return withHeroData[Math.floor(Math.random() * withHeroData.length)]
  }

  renderData(data) { 
    return(
      <div>
        <Header1Comp />
        <div className="c-navbar">
          <NavComp data={data.header.nav_bar} />
        </div>
        <HeroComp hero_data={this.getRandomHero(data.hero_data)} />
        <TeaserComp />
        <section className="c-togglesection">
          <header className={this.state.showSection1 ? 'c-togglesection__header--open' : 'c-togglesection__header'} hidden={this.state.isOpen}>
            <h2>
              <button onClick={()=> this.setState({showSection1: !this.state.showSection1})}>Why Open Access?</button>
            </h2>
          </header>
          <div className="c-togglesection__content" hidden={!this.state.showSection1}>
            <HomeSection1Comp />
          </div>
        </section>
        <section className="c-togglesection">
          <header className={this.state.showSection2 ? 'c-togglesection__header--open' : 'c-togglesection__header'} hidden={this.state.isOpen}>
            <h2>
              <button onClick={()=> this.setState({showSection2: !this.state.showSection2})}>eScholarship Repository</button>
            </h2>
          </header>
          <div className="c-togglesection__content" hidden={!this.state.showSection2}>
            <HomeSection2Comp />
          </div>
        </section>
        <section className="c-togglesection">
          <header className={this.state.showSection3 ? 'c-togglesection__header--open' : 'c-togglesection__header'} hidden={this.state.isOpen}>
            <h2>
              <button onClick={()=> this.setState({showSection3: !this.state.showSection3})}>eScholarship Publishing Services</button>
            </h2>
          </header>
          <div className="c-togglesection__content" hidden={!this.state.showSection3}>
            <HomeSection3Comp />
          </div>
        </section>
      </div>
    )
  }
}

module.exports = HomePage;
