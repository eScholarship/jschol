import React from 'react'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'

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

    var marquee;
    if (data.carousel) {
      marquee = (<MarqueeComp carousel={data.carousel} about={data.unitData.about}/>)
    } else {
      marquee = (<MarqueeComp about={data.unitData.about} />)
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
              <IssueComp issue={this.props.data.content.issue}/>
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