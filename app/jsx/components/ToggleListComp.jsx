// ##### Toggle List Component ##### //

import React from 'react'
import ToggleListSubComp from '../components/ToggleListSubComp.jsx'

class ToggleListComp extends React.Component {
  constructor(props){
    super(props)
    this.state = {override: {open: false, date: new Date()}}
  }
  render() {
    return (
      <div className="c-togglelist">
        <div className="c-togglelist__buttons">
          <button className="o-button__2" onClick = {()=> this.setState({override: {open: true, date: new Date()}})}>Expand All</button>
          <button className="o-button__2" onClick = {()=> this.setState({override: {open: false, date: new Date()}})}>Collapse All</button>
        </div>
        <ul className="c-togglelist__mainlist">
          <li><a href="">Bourns College of Engineering</a></li>
          <li><a href="">Center for Environmental Design Research</a></li>
          <li><a href="">California Academic Partnership Program</a></li>
          <li>
            <ToggleListSubComp title="California Center for Population Research" override={this.state.override}>
              <li><a href="">Safe Transportation Research & Education Center</a></li>
              <li><a href="">UC Berkeley Center for Future Urban Transport: A Volvo Center of Excellence</a></li>
              <li>
                <ToggleListSubComp title="UC Berkeley Transportation Sustainability Research Center" override={this.state.override}>
                  <li><a href="">Center for Latino Policy Research</a></li>
                  <li><a href="">Center for Research on Native American Issues</a></li>
                  <li><a href="">Center for Right-Wing Studies</a></li>
                </ToggleListSubComp>
              </li>
            </ToggleListSubComp>
          </li>
          <li><a href="">California Community College Collaborative (C4)</a></li>
          <li><a href="">California Digital Library</a></li>
          <li><a href="">California Health Benefits Review Program</a></li>
        </ul>
      </div>
    )
  }
}

module.exports = ToggleListComp;
