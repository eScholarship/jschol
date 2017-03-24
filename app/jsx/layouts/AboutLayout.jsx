// ##### About Layout ##### //

import React from 'react'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import NavSubComp from '../components/NavSubComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import SidebarNavComp from '../components/SidebarNavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class AboutLayout extends React.Component {
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
      <div className="l-about">
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
        <BreadcrumbComp />
        <div className="c-columns">
          <aside>
            <section className="o-columnbox2 c-sidebarnav">
              <header>
                <h1>About eScholarship</h1>
              </header>
              <SidebarNavComp />
            </section>
          </aside>
          <main id="maincontent">
            <section className="o-columnbox1">
              <header>
                <h1>About eScholarship</h1>
              </header>
              <p>eScholarship provides a suite of open access, scholarly publishing services and research tools that enable departments, research units, publishing programs, and individual scholars associated with the University of California to have direct control over the creation and dissemination of the full range of their scholarship.
              <p>With eScholarship, you can publish the following original scholarly works on a dynamic research platform available to scholars worldwide:</p>
              </p>
              <ul>
                <li><a className="o-textlink__primary" href="">Books</a></li>
                <li><a className="o-textlink__primary" href="">Journals</a></li>
                <li><a className="o-textlink__primary" href="">Working Papers</a></li>
                <li><a className="o-textlink__primary" href="">Previously Published Works</a></li>
                <li><a className="o-textlink__primary" href="">Conferences</a></li>
              </ul>
              <p>eScholarship also provides deposit and dissemination services for postprints, or previously published articles.</p>
              <p>Publications benefit from manuscript and peer-review management systems, as well as a full range of persistent access and preservation services.</p>
              <p>Learn more about what to expect from publishing with eScholarship.</p>
              <p>eScholarship is a service of the Publishing Group of the California Digital Library.</p>
              <p>Questions? <a className="o-textlink__primary" href="">Contact us</a>.</p>
            </section>
          </main>
        </div>
        <FooterComp />
      </div>
    )
  }
}

module.exports = AboutLayout;
