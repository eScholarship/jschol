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

    var marquee;
    if (this.props.marquee.carousel) {
      marquee = (<MarqueeComp carousel={this.props.marquee.carousel} about={this.props.marquee.about}/>)
    } else {
      marquee = (<MarqueeComp about={this.props.marquee.about} />)
    }

    var seriesList = [];
    for (var s in data.series) {
      if (data.series[s].items.length > 0) {
        seriesList.push(<SeriesComp key={data.series[s].unit_id} data={data.series[s]}/>);
      }
    }

    return (
      <div>
        {marquee}
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <IssueComp issue={data.issue}/>
            </section>
          </main>
          <aside>
            <section className="o-columnbox2">
              <header>
                <h2 className="o-columnbox2__heading">Journal Information</h2>
              </header>
              <JournalInfoComp />
            </section>
            <section className="o-columnbox2">
              <header>
                <h2 className="o-columnbox2__heading">Featured Articles</h2>
                </header>
                <p><a className="o-textlink__secondary" href="">Entre la ficción y el periodismo: Cambio social y la crónica mexicana contemporánea</a> <br/> Nadeau, Evelyn</p> 
                <p><a className="o-textlink__secondary" href="">Journalism in Catalonia During Francoism</a> <br/> Reguant, Monserrat</p>
                <p><a className="o-textlink__secondary" href="">En torno a un cuento olvidado de Clarín: "El oso mayor"</a> <br/> Gil, Angeles Ezama</p>
                <p><a className="o-textlink__secondary" href="">Interview with Guillermo Cabrera Infante</a> <br/> Graham-Jones, Jean; Deosthale, Duleep</p>
                <p><a className="o-textlink__secondary" href="">Lazlo Moussong. Castillos en la letra. Xalapa, México: Universidad Veracruzana, 1986.</a> <br/> Radchik, Laura</p>
            </section>
            <section className="o-columnbox2">
              <header>
                <h2 className="o-columnbox2__heading">Follow us on Twitter</h2>
              </header>
              [content to go here]
            </section>
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = JournalLayout