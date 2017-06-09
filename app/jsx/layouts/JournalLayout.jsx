import React from 'react'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'

class SectionComp extends React.Component {
  static PropTypes = {
    section: React.PropTypes.shape({
      articles: React.PropTypes.array,
      id: React.PropTypes.number,
      issue_id: React.PropTypes.number,
      name: React.PropTypes.string
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

class IssueComp extends React.Component {
  static PropTypes = {
    issue: React.PropTypes.shape({
      cover_page: React.PropTypes.string,
      id: React.PropTypes.number,
      issue: React.PropTypes.string,
      pub_date: React.PropTypes.string,
      sections: React.PropTypes.array,    //See SectionComp prop types directly above 
      unit_id: React.PropTypes.string,
      volume: React.PropTypes.string
    }).isRequired
  }
  
  render() {
    return (
      <div>
      <h4>Volume {this.props.issue.volume}, Issue {this.props.issue.issue}, {this.props.issue.pub_date}</h4>
      {this.props.issue.sections.map(section => <SectionComp key={section.name} section={section}/>)}
      </div>
    )
  }
}

class JournalLayout extends React.Component {
  static propTypes = {
    unit: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      type: React.PropTypes.string.isRequired,
      extent: React.PropTypes.object
    }).isRequired,
    data: React.PropTypes.shape({
      display: React.PropTypes.string,
      issue: React.PropTypes.object          // See IssueComp prop types directly above
    }).isRequired,
    marquee: React.PropTypes.shape({
      carousel: React.PropTypes.any,
      about: React.PropTypes.about
    })
  }
  
  render() {
    var data = this.props.data;

    var seriesList = [];
    for (var s in data.series) {
      if (data.series[s].items.length > 0) {
        seriesList.push(<SeriesComp key={data.series[s].unit_id} data={data.series[s]}/>);
      }
    }

    return (
      <div>
        <MarqueeComp marquee={this.props.marquee} unit={this.props.unit}/>
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
              <IssueComp issue={data.issue}/>
            </section>
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