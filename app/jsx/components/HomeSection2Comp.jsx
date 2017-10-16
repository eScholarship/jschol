// ##### Home Section 2 Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import WizardComp from './WizardComp.jsx'
import { Link } from 'react-router'

class HomeSection2Comp extends React.Component {
  static propTypes = {
    campuses: PropTypes.array.isRequired
  }

  state = { modalOpen: false }

  closeWizardModal = e => {
    this.setState({modalOpen:false})
  }

  render() {
    return (
      <div id="repository" className="c-homesection2">
        <div className="c-homesection2__map"></div>
        <div className="c-homesection2__description">
          <h3>Institutional Repository</h3>
          <p>eScholarship serves as the institutional repository for the ten University of California campuses and affiliated research centers.</p>
          <p>eScholarship Repository content includes postprints (previously published articles), as well as working papers, electronic theses and dissertations (ETDs), student capstone projects, and seminar/conference proceedings.</p>
        </div>
        <button id="wizardlyDeposit" className="c-homesection2__deposit" onClick={(event)=>{
                               this.setState({modalOpen:true})
                               event.preventDefault()} } >Deposit Work</button>
        <Link to="/campuses" className="c-homesection2__browse-campuses">Browse campuses</Link>
        <h3 className="c-homesection2__stat-heading">Repository Holdings</h3>
        <div className="o-stat">
          <div className="o-stat--item">
            <a href="">{this.props.stats.statsCountArticles.toLocaleString()}</a> Articles
          </div>
          <div className="o-stat--item">
            <a href="">{this.props.stats.statsCountBooks.toLocaleString()}</a> Books
          </div>
          <div className="o-stat--units">
            <a href="">{this.props.stats.statsCountThesesDiss.toLocaleString()}</a> Theses 
          </div>
        </div>
        <a href="/search/?q=" className="c-homesection2__browse-all">Browse all eScholarship holdings</a>
        <Link to="/uc/root/repository" className="c-homesection2__more">Learn more about the eScholarship repository</Link>
        <WizardComp showModal={this.state.modalOpen}
                  parentSelector={()=>$('#repository')[0]}
                  onCancel={e=>this.closeWizardModal(e)}
                  campuses={this.props.campuses}
                  data={{campusID: null, campusName: null, unitID: null, unitName: null}}
                />
      </div>
    )
  }
}

module.exports = HomeSection2Comp;
