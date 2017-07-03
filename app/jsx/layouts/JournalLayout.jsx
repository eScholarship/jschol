import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import ItemActionsComp from '../components/ItemActionsComp.jsx'

class VolumeSelector extends React.Component {
  static PropTypes = {
    vip: PropTypes.array.isRequired  // [Volume, Issue, Pub_date]
  }

  getIssuePath = (v,i) => {
    return (v+"/"+i)
  }

  render() {
    let p = this.props
    return (
      <div className="o-input__droplist1">
        <label htmlFor="c-sort1">Select</label>
        <select name="" id="c-sort1">
          <option value={this.getIssuePath(p.vip[0], p.vip[1])}>Volume {p.vip[0]}, Issue {p.vip[1]}, {p.vip[2]}</option>
          <option value="1/2">Volume 1, Issue 2, 1901</option>
          <option value="1/3">Volume 1, Issue 3, 1901</option>
        </select>
      </div>
    )
  }
}

class SectionComp extends React.Component {
  static PropTypes = {
    section: PropTypes.shape({
      articles: PropTypes.array,
      id: PropTypes.number,
      issue_id: PropTypes.number,
      name: PropTypes.string
    }).isRequired
  }
  render() {
    return (
      <div>
        <h3 className="o-heading3">{this.props.section.name}</h3>
        {this.props.section.articles.map(article => <ScholWorksComp key={article.id} result={article}/>)}
      </div>
    )
  }
}

// Issue SIMPLE
class IssueSimpleComp extends React.Component {
  static PropTypes = {
    issue: PropTypes.shape({
      cover_page: PropTypes.string,
      id: PropTypes.number,
      issue: PropTypes.string,
      pub_date: PropTypes.string,
      sections: PropTypes.array,    //See SectionComp prop types directly above 
      unit_id: PropTypes.string,
      volume: PropTypes.string
    }).isRequired
  }

  render() {
    let pi = this.props.issue,
        year = pi.pub_date.match(/\d{4}/),
        issueCurrent = [pi.volume, pi.issue, year]
    return (
      <section className="o-columnbox1">
        {/* ToDo: Enhance ItemActioncComp for journal issue */}
        <ItemActionsComp />
        <div className="c-pub">
          <VolumeSelector vip={issueCurrent} />
          <div className="c-pub__subheading">Focus: Caribbean Studies and Literatures</div>
          {/* No cover page image for simple layout */}
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur fuga laborum, qui debitis vitae quaerat quas ab officia, dolor dignissimos ipsum nam ratione unde animi? Officiis rerum unde eveniet natus. Laboriosam tenetur vel, rem culpa maiores non, tempora voluptatibus quasi quos provident exercitationem itaque dolorum quam sequi dolor odio hic accusamus, repellendus ut dignissimos. Labore modi consectetur ullam, iste accusamus!
          </p>
        </div>
        {pi.sections.map(section => <SectionComp key={section.name} section={section}/>)}
      </section>
    )
  }
}

// Issue SPLASHY
class IssueSplashyComp extends React.Component {
  static PropTypes = {
    issue: PropTypes.shape({
      cover_page: PropTypes.string,
      id: PropTypes.number,
      issue: PropTypes.string,
      pub_date: PropTypes.string,
      sections: PropTypes.array,    //See SectionComp prop types directly above 
      unit_id: PropTypes.string,
      volume: PropTypes.string
    }).isRequired
  }
  
  render() {
    let pi = this.props.issue,
        year = pi.pub_date.match(/\d{4}/),
        issueCurrent = [pi.volume, pi.issue, year]
    return (
      <section className="o-columnbox1">
        {/* ToDo: Enhance ItemActioncComp for journal issue */}
        <ItemActionsComp />
        <div className="c-pub">
          <VolumeSelector vip={issueCurrent} />
          {pi.cover_page && <img className="c-scholworks__article-preview" src={"/assets/"+pi.cover_page.asset_id} width={pi.cover_page.width} height={pi.cover_page.height} alt={_.capitalize(pr.genre) + " image"} />}
          <div className="c-pub__subheading">Focus: Caribbean Studies and Literatures</div>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur fuga laborum, qui debitis vitae quaerat quas ab officia, dolor dignissimos ipsum nam ratione unde animi? Officiis rerum unde eveniet natus. Laboriosam tenetur vel, rem culpa maiores non, tempora voluptatibus quasi quos provident exercitationem itaque dolorum quam sequi dolor odio hic accusamus, repellendus ut dignissimos. Labore modi consectetur ullam, iste accusamus!
          </p>
        </div>
        {/* <h3 className="o-heading3">Table of Contents</h3> */}
        <div className="o-dividecontent2x--ruled">
          {pi.sections.map(section => <SectionComp key={section.name} section={section}/>)}
        </div>
      </section>
    )
  }
}

class JournalLayout extends React.Component {
  static propTypes = {
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      splashy: PropTypes.bool.isRequired, 
      extent: PropTypes.object
    }).isRequired,
    data: PropTypes.shape({
      display: PropTypes.string,
      issue: PropTypes.object          // See IssueComp prop types directly above
    }).isRequired,
    marquee: PropTypes.shape({
      carousel: PropTypes.any,
      about: PropTypes.about
    })
  }
  
  render() {
    let data = this.props.data
    return (
      <div>
        {this.props.marquee && <MarqueeComp marquee={this.props.marquee} unit={this.props.unit}/>}
        <div className="c-columns">
          <main id="maincontent">
          {this.props.data.issue ?
            this.props.unit.splashy ? <IssueSplashyComp issue={data.issue}/> : <IssueSimpleComp issue={data.issue}/>
          :
            <p>Currently no issues to display     {/* ToDo: Bring in issue-specific about text here? */}
            </p>
          }
          </main>
          <aside>
            <section className="o-columnbox1">
              <header>
                <h2>Journal Information</h2>
              </header>
              <JournalInfoComp />
            </section>
            {this.props.sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = JournalLayout
