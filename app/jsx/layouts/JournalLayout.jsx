import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import ItemActionsComp from '../components/ItemActionsComp.jsx'

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
      <h4>Section Heading: {this.props.section.name}</h4>
      {this.props.section.articles.map(article => <ScholWorksComp key={article.id} result={article}/>)}
      </div>
    )
  }
}

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
    return (
      <section className="o-columnbox1">
        <h4>Volume {this.props.issue.volume}, Issue {this.props.issue.issue}, {this.props.issue.pub_date}</h4>
        {this.props.issue.sections.map(section => <SectionComp key={section.name} section={section}/>)}
      </section>
    )
  }
}

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
    return (
      <section className="o-columnbox1">
        <ItemActionsComp />
        {/* Stick an article here with thumbnail left-aligned */}
        <h3 className="o-heading3">Table of Contents</h3>
        <div className="o-dividecontent2x--ruled">
          {/* Stick an article here */}
          <img className="o-imagecontent" src="http://placehold.it/300x150?text=Image" alt="" />
          {/* Stick an article here */}
          <img className="o-imagecontent" src="http://placehold.it/300x150?text=Image" alt="" />
          {/* Stick an article here */}
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
    let data = this.props.data,
        splashy = true

    return (
      <div>
        {this.props.marquee && <MarqueeComp marquee={this.props.marquee} unit={this.props.unit}/>}
        <div className="c-columns">
          <main id="maincontent">
          {splashy ? <IssueSplashyComp issue={data.issue}/> : <IssueSimpleComp issue={data.issue}/> }
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
