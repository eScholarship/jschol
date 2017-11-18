import React from 'react'
import PropTypes from 'prop-types'
import { Link, browserHistory } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import PubComp from '../components/PubComp.jsx'
import IssueActionsComp from '../components/IssueActionsComp.jsx'

class VolumeSelector extends React.Component {
  static PropTypes = {
    vip: PropTypes.array.isRequired,     // [unit_id, Volume, Issue, Pub_date]
    issue_numbering: PropTypes.string,
    title: PropTypes.string,
    issues: PropTypes.array.isRequired   // [ {:id=>3258, :volume=>"1", :issue=>"2", :pub_date=>#<Date: ...}, ... ]
  }

  getIssuePath = (unit_id, v,i) => {
    return `/uc/${unit_id}/${v}/${i}`
  }

  getPubYear = date => {
    return date.match(/\d{4}/)
  }

  issueTitle = (vol, iss, numbering, title, year) => {
    if (vol == "0" && iss == "0") {
      return title 
    }
    else {
      let voliss
      if (!numbering) {
        voliss = "Volume " + vol + ", Issue " + iss 
      } else if (numbering === "volume_only") {
        voliss = "Volume " + vol 
      } else {
        voliss = "Issue " + iss 
      }
      return voliss + ", " + year 
    }
  }

  render() {
    let p = this.props
    let this_issue_title = this.issueTitle(p.vip[1], p.vip[2], p.issue_numbering, p.title, p.vip[3])
    return (
      <div className="o-customselector">
        <h2 className="o-customselector__heading">{this_issue_title}</h2>
        <details className="o-customselector__selector">
          <summary aria-label="Select a different issue"></summary>
          <div className="o-customselector__menu">
            <ul className="o-customselector__items">
              {p.issues.map( i => {
                let numbering = i.attrs ? i.attrs.numbering : null
                let title = i.attrs ? i.attrs.title : null
                let name = this.issueTitle(i.volume, i.issue, numbering, title, this.getPubYear(i.pub_date)) 
                return (<li key={i.id}><Link to={this.getIssuePath(i.unit_id, i.volume, i.issue)}>{name}</Link></li>)})
              }
            </ul>
          </div>
        </details>
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
      numbering: PropTypes.string,
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
      rights: PropTypes.string,
      sections: PropTypes.arrayOf(PropTypes.shape({
        articles: PropTypes.array,
        id: PropTypes.number,
        issue_id: PropTypes.number,
        name: PropTypes.string
      })).isRequired,
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
          <VolumeSelector vip={issueCurrent} issue_numbering={pi.numbering} title={pi.title} issues={this.props.issues} />
    {/* TITLE AND DESCRIPTION */}
          {this.props.display=="magazine" &&
            <div className="c-pubpreview">
            {pi.cover &&
              <div className="c-pubpreview__img"><img src={"/assets/"+pi.cover.asset_id} width="150" height="200" alt="Issue cover" /></div> }
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
    {/* ARTICLE LISTINGS */}
        <div>
      { this.props.display=="magazine" ?
        pi.sections.map(section =>
          <div key={section.name}>
            <h3 className="o-heading1a">{section.name}</h3>
            <div className="o-dividecontent2x--ruled">
              {section.articles.map(article => <PubComp h="h4" key={article.id} result={article}/>)}
            </div>
          </div>
        )
      :
        pi.sections.map(section =>
          <div key={section.name}>
            <h3 className="o-heading1a">{section.name}</h3>
            {section.articles.map(article => <PubComp h="h4" key={article.id} result={article}/>)}
          </div>
        )
      }
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
      extent: PropTypes.object
    }).isRequired,
    data: PropTypes.shape({
      display: PropTypes.string,
      doaj: PropTypes.string,
      issn: PropTypes.string,
      eissn: PropTypes.string,
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
    let marquee = this.props.marquee
    return (
      <div>
      {((marquee.carousel && marquee.slides) || marquee.about) &&
        <MarqueeComp marquee={marquee} />
      }
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
          {(data.doaj || (data.issue && data.issue.rights) || data.issn || data.eissn) && 
            <section className="o-columnbox1">
              <header>
                <h2>Journal Information</h2>
              </header>
              <JournalInfoComp doaj={data.doaj} rights={data.issue && data.issue.rights} issn={data.issn} eissn={data.eissn} />
            </section>
          }
            {this.props.sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = JournalLayout
