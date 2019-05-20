// ##### Home Layout ##### //

import React from 'react'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import NavSubComp from '../components/NavSubComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import HeroComp from '../components/HeroComp.jsx'
import TeaserComp from '../components/TeaserComp.jsx'
import HomeSection1Comp from '../components/HomeSection1Comp.jsx'
import HomeSection2Comp from '../components/HomeSection2Comp.jsx'
import HomeSection3Comp from '../components/HomeSection3Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class HomeLayout extends React.Component {
  constructor(props){
    super(props)
    this.state = {submenuActive: null, showSection1: true, showSection2: true, showSection3: true}
  }
  componentDidMount() {
    if (matchMedia) {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen3+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }
  widthChange = ()=> {
    this.setState({isOpen: this.mq.matches})
  }
  render() {
    return (
      <div>
        <a href="#maincontent" className="c-skipnav">Skip to main content</a>
        <Header1Comp />
        <div className="c-navbar">
          <div className="c-nav">
            <details open={this.state.isOpen ? "open" : ""} className="c-nav__main">
              <summary className="c-nav__main-button"><span>Menu</span>
              </summary>
              <nav className={this.state.submenuActive ? "c-nav__main-items--submenu-active" : "c-nav__main-items"}>
                <NavSubComp name="About" open={this.state.submenuActive == 1} onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? 1 : null})}>
                  <a href="">About Us</a>
                  <a href="">Aims &amp; Scope</a>
                  <a href="">Editorial Board</a>
                </NavSubComp>
                <NavSubComp name="Campus Sites" open={this.state.submenuActive == 2} onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? 2 : null})}>
                  <a href="">UC Berkeley</a>
                  <a href="">UC Davis</a>
                  <a href="">UC Irvine</a>
                  <a href="">UCLA</a>
                  <a href="">UC Merced</a>
                  <a href="">UC Riverside</a>
                  <a href="">UC San Diego</a>
                  <a href="">UC San Francisco</a>
                  <a href="">UC Santa Barbara</a>
                  <a href="">UC Santa Cruz</a>
                  <a href="">UC Office of the President</a>
                  <a href="">UC Press</a>
                </NavSubComp>
                <NavSubComp name="UC Open Access" open={this.state.submenuActive == 3} onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? 3 : null})}>
                  <a href="">To Be Determined 1</a>
                  <a href="">To Be Determined 2</a>
                  <a href="">To Be Determined 3</a>
                </NavSubComp>
                <a href="">eScholarship Publishing</a>
              </nav>
            </details>
          </div>
        </div>
        <HeroComp />
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
        <FooterComp />
      </div>
    )
  }
}

module.exports = HomeLayout;
