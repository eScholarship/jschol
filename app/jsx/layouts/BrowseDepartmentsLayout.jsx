// ##### Browse Departments Layout ##### //

import React from 'react'
import Header2Comp from '../components/Header2Comp.jsx'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import WellComp from '../components/WellComp.jsx'
import ToggleListComp from '../components/ToggleListComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class BrowseDepartmentsLayout extends React.Component {
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
      <div className="l-browsedepartments">
      <a href="#maincontent" className="c-skipnav">Skip to main content</a>
        <Header2Comp />
        <div className="c-subheader2">
          <CampusSelectorComp />
          <img className="c-subheader2__banner" src="images/temp_journal-banner.png" alt=""/>
          <div className="c-subheader2__sidebar">
            <button className="o-button__3">Deposit</button>
            <div className="c-subheader2__sidebar-text">University of California, Berkeley <br/>Publications in eScholarship</div>
            <div className="c-subheader2__sidebar-number">16,464</div>
            <div>[text to go here]</div>
          </div>
        </div>
        <div className="c-navbar">
          <div className="c-nav">
            <details open={this.state.isOpen ? "open" : ""} className="c-nav__main">
              <summary className="c-nav__main-button">Menu
              </summary>
              <nav className={this.state.submenuActive ? "c-nav__main-items--submenu-active" : "c-nav__main-items"}>
                <a href="" className="c-nav__item--active">Open Access Policies</a>
                <a href="">Journals</a>
                <a href="">Academic Units</a>
              </nav>
            </details>
          </div>
        </div>
        <nav className="c-breadcrumb">
          <a href="">eScholarship</a>
          <a href="">UC Berkeley</a>
          <a className="c-breadcrumb-link--active" href="">Academic Units</a>
        </nav>
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
              <header>
                <h2>Academic Units</h2>
              </header>
              <WellComp />
              <ToggleListComp />
            </section>
          </main>
          <aside>
            <section className="o-columnbox2">
              <header>
                <h2>Featured Journals</h2>
              </header>
              <a href="" className="o-journal1">
                <figure>
                  <img src="images/sample_journal1.png" alt="sample journal"/>
                  <figcaption>Chicana-Latina Law Review</figcaption>
                </figure>
              </a>
              <a href="" className="o-journal1">
                <figure>
                  <img src="images/sample_journal1.png" alt="sample journal"/>
                  <figcaption>Chicana-Latina Law Review</figcaption>
                </figure>
              </a>
              <a href="" className="o-journal1">
                <figure>
                  <img src="images/sample_journal1.png" alt="sample journal"/>
                  <figcaption>Chicana-Latina Law Review</figcaption>
                </figure>
              </a>
            </section>
          </aside>
        </div>
        <FooterComp />
      </div>
    )
  }
}

module.exports = BrowseDepartmentsLayout;
