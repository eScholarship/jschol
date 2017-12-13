// ##### Refine Component ##### //

import React from 'react'
import Breakpoints from '../../js/breakpoints.json'
import PubYearComp from '../components/PubYearComp.jsx'

class RefineComp extends React.Component {
  state={refineActive: false, drawerOpen: false}

  componentWillMount() {
    if (matchMedia) {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen1+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }
  widthChange = ()=> {
    this.setState({refineActive: this.mq.matches, drawerOpen: this.mq.matches})
  }

  render() {
    return (
      <div className={this.state.refineActive ? "c-refine--no-drawer" : "c-refine--has-drawer"}>
        <button className="c-refine__button--open" onClick={()=> this.setState({drawerOpen: true})} hidden={this.state.drawerOpen}>Refine Results</button>
        <button className="c-refine__button--close" onClick={()=> this.setState({drawerOpen: false})} hidden={!this.state.drawerOpen}>Back to Results</button>
        <div className={this.state.drawerOpen ? "c-refine__drawer--opened" : "c-refine__drawer--closed"}>
          {/* Facets */}
          <details className="c-facetbox">
            {/* Each facetbox needs a distinct <span id> and <fieldset aria-labelledby> matching value, like facetbox1, facetbox2, etc. */}
            <summary className="c-facetbox__summary"><span id="c-facetbox1">Supplemental Material</span></summary>
            <fieldset aria-labelledby="c-facetbox1">
              <ul className="c-checkbox--2column">
                {/* 'id' and 'htmlFor' values must contain a unique number per each pair below for accessibility */}
                <li>
                  <input id="c-checkbox__media1" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__media1" className="c-checkbox__label">Video (6)</label>
                </li>
                <li>
                  <input id="c-checkbox__media2" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__media2" className="c-checkbox__label">Audio (13)</label>
                </li>
                <li>
                  <input id="c-checkbox__media3" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__media3" className="c-checkbox__label">Images (2)</label>
                </li>
                <li>
                  <input id="c-checkbox__media4" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__media4" className="c-checkbox__label">PDF (24)</label>
                </li>
                <li>
                  <input id="c-checkbox__media5" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__media5" className="c-checkbox__label">ZIP (19)</label>
                </li>
                <li>
                  <input id="c-checkbox__media6" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__media6" className="c-checkbox__label">Other (7)</label>
                </li>
              </ul>
            </fieldset>
          </details>
          <details className="c-facetbox">
            {/* Each facetbox needs a distinct <span id> and <fieldset aria-labelledby> matching value, like facetbox1, facetbox2, etc. */}
            <summary className="c-facetbox__summary"><span id="c-facetbox2">Publication Year</span></summary>
            <fieldset aria-labelledby="c-facetbox2">
              <PubYearComp />
            </fieldset>
          </details>
          <details className="c-facetbox">
            {/* Each facetbox needs a distinct <span id> and <fieldset aria-labelledby> matching value, like facetbox1, facetbox2, etc. */}
            <summary className="c-facetbox__summary"><span id="c-facetbox3">Department</span></summary>
            <fieldset aria-labelledby="c-facetbox3">
              <ul className="c-checkbox">
                {/* 'id' and 'htmlFor' values must contain a unique number per each pair below for accessibility */}
                <li>
                  <input id="c-checkbox__number1" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__number1" className="c-checkbox__label">Agricultural History Center (4)</label>
                </li>
                <li>
                  <input id="c-checkbox__number2" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__number2" className="c-checkbox__label">Agriculture and Natural Resources Research and Extension Centers (15)</label>
                  <ul>
                    <li>
                      <input id="c-checkbox__number3" type="checkbox" className="c-checkbox__input"/>
                      <label htmlFor="c-checkbox__number3" className="c-checkbox__label">Hopland Research and Extension Center (7)</label>
                    </li>
                    <li>
                      <input id="c-checkbox__number4" type="checkbox" className="c-checkbox__input"/>
                      <label htmlFor="c-checkbox__number4" className="c-checkbox__label">Sierra Foothill Research and Extension Center (11)</label>
                    </li>
                  </ul>
                </li>
                <li>
                  <input id="c-checkbox__number6" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__number6" className="c-checkbox__label">American Cultures Center (2)</label>
                </li>
                <li>
                  <input id="c-checkbox__number7" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__number7" className="c-checkbox__label">American Cultures and Global Contexts Center (19)</label>
                </li>
              </ul>
              <button className="c-facetbox__show-more" onClick={this.handleOpenModal}>Show more</button>
            </fieldset>
          </details>
          <details className="c-facetbox">
            {/* Each facetbox needs a distinct <span id> and <fieldset aria-labelledby> matching value, like facetbox1, facetbox2, etc. */}
            <summary className="c-facetbox__summary"><span id="c-facetbox4">Reuse License</span></summary>
            <fieldset aria-labelledby="c-facetbox4">
              <ul className="c-checkbox">
                {/* 'id' and 'htmlFor' values must contain a unique number per each pair below for accessibility */}
                <li className="c-checkbox__attrib-cc-by">
                  <input id="c-checkbox__attrib1" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__attrib1" className="c-checkbox__label">Attribution required (24)</label>
                </li>
                <li className="c-checkbox__attrib-cc-by-nc">
                  <input id="c-checkbox__attrib2" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__attrib2" className="c-checkbox__label">Attribution; NonCommercial use only (26)</label>
                </li>
                <li className="c-checkbox__attrib-cc-by-nd">
                  <input id="c-checkbox__attrib3" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__attrib3" className="c-checkbox__label">Attribution; No derivatives (5)</label>
                </li>
                <li className="c-checkbox__attrib-cc-by-sa">
                  <input id="c-checkbox__attrib4" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__attrib4" className="c-checkbox__label">Attribution; Derivatives must use same license (12)</label>
                </li>
                <li className="c-checkbox__attrib-cc-by-nc-sa">
                  <input id="c-checkbox__attrib5" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__attrib5" className="c-checkbox__label">Attribution, NonCommercial use, Derivatives use same license (13)</label>
                </li>
                <li className="c-checkbox__attrib-cc-by-nc-nd">
                  <input id="c-checkbox__attrib6" type="checkbox" className="c-checkbox__input"/>
                  <label htmlFor="c-checkbox__attrib6" className="c-checkbox__label">Attribution; NonCommercial use; No derivatives (57)</label>
                </li>
              </ul>
            </fieldset>
          </details>
        </div>
      </div>
    )
  }
}

module.exports = RefineComp;
