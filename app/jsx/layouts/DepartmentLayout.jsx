import React from 'react'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import ShareComp from '../components/ShareComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'

// class ItemPreviewSmall extends React.Component {
//   componentDidMount() {
//     $('.c-scholworks__abstract, .c-scholworks__author').dotdotdot({watch: "window"});
//   }
//   render() {
//     return (
//       <div>
//         <Link to={"/item/"+this.props.id.replace(/^qt/, "")}>{this.props.title}</Link>
//         <div>
//           { this.props.authors.map((author) =>
//             <span key={author.name}>{author.name}</span>) }
//         </div>
//         {this.props.abstract && <p className="c-scholworks__abstract">{this.props.abstract}</p>}
//         {!this.props.abstract && <div style={{marginBottom: '20px'}}/>}
//       </div>
//     )
//   }
// }

class SeriesComp extends React.Component {
  render() {
    return (
      <div style={{marginBottom: '30px'}}>
      <h4>Series: <Link to={"/unit/"+this.props.data.unit_id}>{this.props.data.name}</Link></h4>
      <div style={{paddingLeft: '20px'}}>
        { this.props.data.items.map((item) =>
          <ScholWorksComp key={item.id} result={item}/>) }
        <p>{this.props.data.count-3} more works - <Link to={"/unit/"+this.props.data.unit_id}>show all</Link></p>
      </div>
      </div>
    )
  }
}

class DepartmentLayout extends React.Component {
  render() {
    var data = this.props.data;

    var marquee;
    if (this.props.marquee.carousel) {
      marquee = <MarqueeComp carousel={this.props.marquee.carousel} about={this.props.marquee.about}/>
    } else {
      marquee = <MarqueeComp about={this.props.marquee.about} />
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
              <p>There are {this.props.marquee.extent.count} publications in this collection, published between {this.props.marquee.extent.pub_year.start} and {this.props.marquee.extent.pub_year.end}.</p>
              {data.journals.length > 0 && 
                <div><h3>Journals by {this.props.unit.name}</h3>
                <ul>
                  { data.journals.map((child) =>
                    <li key={child.unit_id}><Link to={"/unit/"+child.unit_id}>{child.name}</Link></li>) }
                </ul></div>
              }
              <h3>Works by {this.props.unit.name}</h3>
              {seriesList}
              <hr/>
              <h3>Related Research Centers & Groups</h3>
              <ul>
                { data.related_orus.map((child) =>
                  <li key={child.unit_id}><Link to={"/unit/"+child.unit_id}>{child.name}</Link></li>) }
              </ul>
            </section>
          </main>
          <aside>
            <section className="o-columnbox2">
              <ShareComp />
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

module.exports = DepartmentLayout