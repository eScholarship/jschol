// ##### Header1 Component ##### //

import React from 'react'
import { Link } from 'react-router'
import Breakpoints from '../../js/breakpoints.json'
import Search1Comp from '../components/Search1Comp.jsx'
import AdminBarComp from '../components/AdminBarComp.jsx'
import WizardComp from './WizardComp.jsx'

class HeaderComp1 extends React.Component {
  state = {searchActive: false,
           modalOpen: false }

  closeWizardModal = e => {
    this.setState({modalOpen:false})
  }

  render() {
    return (
    <div>
      <AdminBarComp/>
      <header className="c-header">
        <button style={{display: 'none'}} id="wizardlyDeposit" onClick={(event)=>{
                  this.setState({modalOpen:true})
                  event.preventDefault()} } >Deposit</button>
        <WizardComp showModal={this.state.modalOpen}
                  parentSelector={()=>$('#c-header')[0]}
                  onCancel={e=>this.closeWizardModal(e)}
                  campuses={this.props.campuses}
                  data={{campusID: null, campusName: null, unitID: null, unitName: null}}
                />
        <Link className="c-header__logo1" to="/">
          <picture>
            <source srcSet="/images/logo_escholarship.svg" media={"(min-width: "+Breakpoints.screen3+")"}/>
            <img src="/images/logo_eschol-mobile.svg" alt="eScholarship"/>
          </picture>
        </Link>
        <div className={this.state.searchActive ? "c-header__search--active" : "c-header__search"}>
          <Search1Comp onClose = {()=>this.setState({searchActive: false})} />
        </div>
        <button className="c-header__search-open-button" aria-label="open search field" onClick = {()=> this.setState({searchActive: true})}></button>
      </header>
    </div>
    )
  }
}

module.exports = HeaderComp1;
