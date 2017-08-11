import React from 'react'
import PropTypes from 'prop-types'
import { Link, browserHistory } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import PubPreviewComp from '../components/PubPreviewComp.jsx'
import IssueActionsComp from '../components/IssueActionsComp.jsx'

class VolumeSelector extends React.Component {
  static PropTypes = {
    vip: PropTypes.array.isRequired,     // [unit_id, Volume, Issue, Pub_date]
    issues: PropTypes.array.isRequired   // [ {:id=>3258, :volume=>"1", :issue=>"2", :pub_date=>#<Date: ...}, ... ]
  }

  getIssuePath = (unit_id, v,i) => {
    return `/uc/${unit_id}/${v}/${i}`
  }

  getPubYear = date => {
    return date.match(/\d{4}/)
  }

  render() {
    let p = this.props
    return (
      <div className="o-customselector">
        <h1 className="o-customselector__heading">{`Volume ${p.vip[1]}, Issue ${p.vip[2]}, ${p.vip[3]}`}</h1>
        <details className="o-customselector__selector">
          <summary aria-label="Select a different issue"></summary>
          <div className="o-customselector__menu">
            <ul className="o-customselector__items">
              {p.issues.map((i) => 
                <li key={i.id}>
                  <Link to={this.getIssuePath(i.unit_id, i.volume, i.issue)}>Volume {i.volume}, Issue {i.issue}, {this.getPubYear(i.pub_date)}</Link>
                </li>)}
            </ul>
          </div>
        </details>
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
        <h2 className="o-heading3">{this.props.section.name}</h2>
        {this.props.display == "magazine" ?
          this.props.section.articles.map(article => <ScholWorksComp h="h3" key={article.id} result={article}/>)
        :
          this.props.section.articles.map(article => <PubPreviewComp h="h3" key={article.id} result={article}/>)
        }
      </div>
    )
  }
}

class IssueComp extends React.Component {
  static PropTypes = {
    display: PropTypes.string.isRequired,
    issue: PropTypes.shape({
      id: PropTypes.number,
      unit_id: PropTypes.string,
      volume: PropTypes.string,
      issue: PropTypes.string,
      pub_date: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      cover: PropTypes.shape({
        asset_id: PropTypes.string.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        image_type: PropTypes.string.isRequired,
        caption: PropTypes.string
      }),
      sections: PropTypes.array,    //See SectionComp prop types directly above 
      rights: PropTypes.string,
    }).isRequired,
    issues: PropTypes.array.isRequired   // Array of issue hashes
  }
  
  render() {
    let pi = this.props.issue,
        year = pi.pub_date.match(/\d{4}/),
        issueCurrent = [pi.unit_id, pi.volume, pi.issue, year]
    return (
      <section className="o-columnbox1">
        <IssueActionsComp unit_id={pi.unit_id} buy_link={pi.buy_link} />
        {/*              articles={} */}
        <div className="c-pub">
          <VolumeSelector vip={issueCurrent} issues={this.props.issues} />
          <br/><br/>
          {this.props.display=="magazine" &&
            <div className="c-pubpreview">
            {pi.cover &&
              <div className="c-pubpreview__img"><img className="c-scholworks__article-preview" src={"/assets/"+pi.cover.asset_id} width="150" height="200" alt="Issue cover" /></div> }
              <div className="c-pub">
              {pi.title &&
                <div className="c-pub__subheading">{pi.title}</div> }
                <p>{pi.description}</p>
              </div>
            </div>
          } 
          {this.props.display!="magazine" && pi.title &&
            <div className="c-pub__subheading">{pi.title}</div> }
          {this.props.display!="magazine" && pi.description &&
            (<p>{pi.description}</p>) }
        </div>
      {this.props.display=="magazine" ?
        <div className="o-dividecontent2x--ruled">
          {pi.sections.map(section => <SectionComp key={section.name} section={section} display={this.props.display} />)}
        </div>
      :
        (pi.sections.map(section => <SectionComp key={section.name} section={section} display={this.props.display} />))
      }
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
      extent: PropTypes.object
    }).isRequired,
    data: PropTypes.shape({
      display: PropTypes.string,
      issue: PropTypes.object,     // See IssueComp prop types directly above
      issues: PropTypes.array
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
            <IssueComp issue={data.issue} issues={data.issues} display={data.display} />
          :
            <section className="o-columnbox1">
              <p>Currently no issues to display
              <br/> <br/> <br/> <br/> </p>
            </section>
          }
          </main>
          <aside>
            <section className="o-columnbox1">
              <header>
                <h2>Journal Information</h2>
              </header>
              <JournalInfoComp rights={data.issue && data.issue.rights} />
            </section>
            {this.props.sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = JournalLayout
