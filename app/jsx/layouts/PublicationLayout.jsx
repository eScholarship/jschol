import React from 'react'
import PropTypes from 'prop-types'
import { Link, browserHistory } from 'react-router-dom'

import MarqueeComp from '../components/MarqueeComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'
import IssueComp from '../components/IssueComp.jsx'
import PubComp from '../components/PubComp.jsx'
import IssueActionsComp from '../components/IssueActionsComp.jsx'

const PUBLICATION_CONFIG = {
  journal: {
    sidebarTitle: 'Journal Information',
    defaultMessage: 'This journal\'s first issue is coming soon.'
  },
  conference_proceedings: {
    sidebarTitle: 'Proceedings Information',
    defaultMessage: 'Conference proceedings are coming soon.'
  }
}

class VolumeSelector extends React.Component {
  static propTypes = {
    current_issue_title: PropTypes.string,
    issues: PropTypes.array.isRequired  // [ {:id=>-1, :name=>"Volume 14, Issue 0, 2017",
    // :volume=>"1", :issue=>"2", :published=>#<Date: ...}, ... ]
  }

  getIssuePath = (unit_id, v, i) => {
    return `/uc/${unit_id}/${v}/${i}`
  }

  getPubYear = date => {
    return date.match(/\d{4}/)
  }

  render() {
    let p = this.props
    return (
      <div className="o-customselector">
        <h2 className="o-customselector__heading">{p.current_issue_title ? p.current_issue_title : "This Issue"}</h2>
        <details className="o-customselector__selector">
          <summary aria-label="Select a different issue"></summary>
          <div className="o-customselector__menu">
            <ul className="o-customselector__items">
              {p.issues.map(i => {
                return (<li key={i.id}><Link to={this.getIssuePath(i.unit_id, i.volume, i.issue)}>{i.name}</Link></li>)
              })
              }
            </ul>
          </div>
        </details>
      </div>
    )
  }
}

class IssueWrapperComp extends React.Component {
  static propTypes = {
    display: PropTypes.string.isRequired,
    issue: PropTypes.shape({
      id: PropTypes.number,
      unit_id: PropTypes.string,
      volume: PropTypes.string,
      issue: PropTypes.string,
      numbering: PropTypes.string,
      published: PropTypes.string,
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
      pi_title = this.props.issues.find(x => x.issue_id === pi.id).name
    return (
      <section className="o-columnbox1">
        <IssueActionsComp unit_id={pi.unit_id} buy_link={pi.buy_link} />
        {/*              articles={} */}
        <VolumeSelector current_issue_title={pi_title} issues={this.props.issues} />
        {(pi.cover || pi.title || pi.description) &&
          <IssueComp cover={pi.cover} title={pi.title} description={pi.description} />
        }
        {/* ARTICLE LISTINGS */}
        <div>
          {this.props.display == "magazine" ?
            pi.sections.map(section =>
              <div key={section.name}>
                <h3 className="o-heading1a">{section.name}</h3>
                <div className="o-dividecontent2x--ruled">
                  {section.articles.map(article => <PubComp h="h4" key={article.id} result={article} />)}
                </div>
              </div>
            )
            :
            pi.sections.map(section =>
              <div key={section.name}>
                <h3 className="o-heading1a">{section.name}</h3>
                {section.articles.map(article => <PubComp h="h4" key={article.id} result={article} />)}
              </div>
            )
          }
        </div>
      </section>
    )
  }
}

class PublicationLayout extends React.Component {
  static propTypes = {
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      extent: PropTypes.object
    }).isRequired,
    data: PropTypes.shape({
      display: PropTypes.string,
      doaj: PropTypes.bool,
      issn: PropTypes.string,
      eissn: PropTypes.string,
      issue: PropTypes.object,     // See IssueWrapperComp prop types directly above
      issuesSubNav: PropTypes.array
    }).isRequired,
    marquee: PropTypes.shape({
      carousel: PropTypes.any,
      about: PropTypes.about
    })
  }

  render() {
    const { data, marquee, sidebar, unit } = this.props
    const unitType = unit.type
    
    const config = PUBLICATION_CONFIG[unitType]

    return (
      <div>
        {((marquee.carousel && marquee.slides) || marquee.about) &&
          <MarqueeComp marquee={marquee} />
        }
        <div className="c-columns">
          <main id="maincontent">

            {data.issue ?
              <IssueWrapperComp issue={data.issue} issues={data.issuesSubNav} display={data.display} />
              :
              <section className="o-columnbox1">
                <p>
                  {config.defaultMessage}
                  <br /> <br /> <br /> <br /> 
                </p>
              </section>
            }

          </main>
          <aside>
            {(data.doaj || (data.issue && data.issue.rights) || data.issn || data.eissn) &&
              <section className="o-columnbox1">
                <header>
                  <h2>{config.sidebarTitle}</h2>
                </header>
                <JournalInfoComp doaj={data.doaj} rights={data.issue && data.issue.rights} issn={data.issn} eissn={data.eissn} cc_license_text={data.issue.use_item_rights && data.cc_license_text} />
              </section>
            }
            {sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

export default PublicationLayout