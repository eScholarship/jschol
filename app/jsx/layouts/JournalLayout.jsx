import React from 'react'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'

class IssueListItemComp extends React.Component {
  render() {
    return (
      <div>
      <Link to={"/item/"+this.props.item.id.replace(/^qt/, "")}>{this.props.item.title}</Link>
      <h6>{this.props.item.authors.map(author => <span>{author.name}</span>)}</h6>
      <h6>{this.props.item.abstract}</h6>
      </div>
    )
  }
}

class SectionComp extends React.Component {
  render() {
    return (
      <div>
      <h5>{this.props.section.name}</h5>
      {this.props.section.articles.map(article => <IssueListItemComp item={article}/>)}
      </div>
    )
  }
}

class IssueComp extends React.Component {
  render() {
    return (
      <div>
      <h4>Volume {this.props.issue.volume}, Issue {this.props.issue.issue}, {this.props.issue.pub_date}</h4>
      {this.props.issue.sections.map(section => <SectionComp section={section}/>)}
      </div>
    )
  }
}

class JournalLayout extends React.Component {
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
        <MarqueeComp />
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <IssueComp issue={this.props.data.content.issue}/>
            </section>
          </main>
          <aside>
            <section className="o-columnbox2">
            </section>
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = JournalLayout