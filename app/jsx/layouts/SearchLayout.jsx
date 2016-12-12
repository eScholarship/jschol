// ##### Search Layout ##### //

import React from 'react'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import ExportComp from '../components/ExportComp.jsx'
import FilterComp from '../components/FilterComp.jsx'
import CheckboxComp from '../components/CheckboxComp.jsx'
import SortComp from '../components/SortComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
import InfoPagesComp from '../components/InfoPagesComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class SearchLayout extends React.Component {
  render() {
    return (
      <div className="l-search">
        <Header1Comp />
        <Nav1Comp />
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
          <main>
            <div className="l-search__sort-pagination">
              <SortComp />
              <PaginationComp />
            </div>
            <section className="o-columnbox1">
              <header>
                <h2 className="o-columnbox1__heading">Informational Pages (12 results)</h2>
              </header>
              <InfoPagesComp />
            </section>
            <section className="o-columnbox1">
              <header>
                <h2 className="o-columnbox1__heading">Scholarly Works (12,023 results)</h2>
              </header>
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
