// ##### Search Layout ##### //

import React from 'react'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import NavSubComp from '../components/NavSubComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import ExportComp from '../components/ExportComp.jsx'
import FilterComp from '../components/FilterComp.jsx'
import CheckboxComp from '../components/CheckboxComp.jsx'
import SortComp from '../components/SortComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
import InfoPagesComp from '../components/InfoPagesComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class SearchLayout extends React.Component {
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
      <div className="l-search">
        <a href="#maincontent" className="c-skipnav">Skip to main content</a>
        <div className="c-subheader1">
          <div className="c-subheader1__header">
            <Header1Comp />
          </div>
          <div className="c-subheader1__nav">
            <div className="c-nav">
              <details open={this.state.isOpen ? "open" : ""} className="c-nav__main">
                <summary className="c-nav__main-button">Menu
                </summary>
                <nav className={this.state.submenuActive ? "c-nav__main-items--submenu-active" : "c-nav__main-items"}>
                  <NavSubComp name="Campus Sites" open={this.state.submenuActive == 1} onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? 1 : null})}>
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
                  <a href="" className="c-nav__item--active">UC Open Access Policies</a>
                  <a href="">eScholarship Publishing</a>
                </nav>
              </details>
            </div>
          </div>
          <div className="c-subheader1__button">
            <button className="o-button__3">Get Started</button>
          </div>
        </div>
        <ExportComp />
        <div className="c-columns">
          <aside>
            <FilterComp />
            <details className="c-facetbox">
              <summary className="c-facetbox__summary">Refine By</summary>
              <div className="c-checkbox">
                <input id="c-checkbox__number6" type="checkbox" className="c-checkbox__input"/>
                <label htmlFor="c-checkbox__number6" className="c-checkbox__label">Peer-Reviewed only (##)</label>
              </div>
            </details>
            <details className="c-facetbox">
              <summary className="c-facetbox__summary">Research</summary>
              <div className="c-checkbox">
                <input id="c-checkbox__number7" type="checkbox" className="c-checkbox__input"/>
                <label htmlFor="c-checkbox__number7" className="c-checkbox__label">Articles (##)</label>
                <input id="c-checkbox__number8" type="checkbox" className="c-checkbox__input"/>
                <label htmlFor="c-checkbox__number8" className="c-checkbox__label">Books (##)</label>
                <input id="c-checkbox__number9" type="checkbox" className="c-checkbox__input"/>
                <label htmlFor="c-checkbox__number9" className="c-checkbox__label">Journals (##)</label>
              </div>
            </details>
            <details className="c-facetbox">
              <summary className="c-facetbox__summary">Content Type</summary>
                <CheckboxComp />
            </details>
          </aside>
          <main id="maincontent">
            <section className="o-columnbox1">
              <header>
                <h2>Informational Pages (12 results)</h2>
              </header>
              <InfoPagesComp />
            </section>
            <section className="o-columnbox1">
              <header>
                <h2>Scholarly Works (12,023 results)</h2>
              </header>
              <div className="l-search__sort-pagination">
                <SortComp />
                <PaginationComp />
              </div>
              <ScholWorksComp />
              <ScholWorksComp />
            </section>
          </main>
        </div>
        <FooterComp />
      </div>
    )
  }
}

module.exports = SearchLayout;
