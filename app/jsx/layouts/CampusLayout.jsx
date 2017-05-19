// ##### Campus Layout ##### //

import React from 'react'
import Header2Comp from '../components/Header2Comp.jsx'
import CampusSearchComp from '../components/CampusSearchComp.jsx'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import HeatMapComp from '../components/HeatMapComp.jsx'
import CampusCarouselComp from '../components/CampusCarouselComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class CampusLayout extends React.Component {
  constructor(props){
    super(props)
    this.state = {submenuActive: null}
  }
  componentWillMount() {
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
        <Header2Comp />
        <div className="c-subheader2">
          <CampusSelectorComp />
          <img className="c-subheader2__banner" src="images/temp_journal-banner.png" alt=""/>
          <div className="c-subheader2__sidebar">
            <button className="o-button__3">Deposit</button>
            <div className="c-subheader2__sidebar-text">University of California, Berkeley <br/>Publications in eScholarship</div>
            <div className="c-subheader2__sidebar-number">16,464</div>
          </div>
        </div>
        <div className="c-navbar">
          <div className="c-nav">
            <details open={this.state.isOpen ? "open" : ""} className="c-nav__main">
              <summary className="c-nav__main-button"><span>Menu</span>
              </summary>
              <nav className={this.state.submenuActive ? "c-nav__main-items--submenu-active" : "c-nav__main-items"}>
                <a href="" className="c-nav__item--active">Open Access Policies</a>
                <a href="">Journals</a>
                <a href="">Academic Units</a>
              </nav>
            </details>
          </div>
        </div>
        <HeatMapComp />
        <CampusCarouselComp />
        <div className="c-columns">
          <main id="maincontent">
            <CampusSearchComp />
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
            <section className="o-columnbox1">
              <header>
                <h2>UC Berkeley Datasets</h2>
              </header>
              [content to go here]
            </section>
            <section className="o-columnbox1">
              <header>
                <h2>Follow Us On Twitter</h2>
              </header>
              [content to go here]
            </section>
          </aside>
        </div>
        <FooterComp />
      </div>
    )
  }
}

module.exports = CampusLayout;
