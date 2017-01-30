import React from 'react'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'

class ItemPreviewSmall extends React.Component {
  componentDidMount() {
    $('.c-scholworks__abstract, .c-scholworks__author').dotdotdot({watch: "window"});
  }
  render() {
    return (
      <div>
        <Link to={"/item/"+this.props.item_id.replace(/^qt/, "")}>{this.props.title}</Link>
        <div>
          { this.props.authors.map((author) =>
            <span key={author}>{author}</span>) }
        </div>
        {this.props.abstract && <p className="c-scholworks__abstract">{this.props.abstract}</p>}
        {!this.props.abstract && <div style={{marginBottom: '20px'}}/>}
      </div>
    )
  }
}

class SeriesComp extends React.Component {
  render() {
    return (
      <div style={{marginBottom: '30px'}}>
      <h4><Link to={"/unit/"+this.props.data.unit_id}>{this.props.data.name}</Link></h4>
      <div style={{paddingLeft: '20px'}}>
        { this.props.data.items.map((item) =>
          <ItemPreviewSmall key={item.item_id} item_id={item.item_id} title={item.title} authors={item.authors} abstract={item.abstract}/>) }
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
    if (data.carouselWidget) {
      marquee = <MarqueeComp carousel={data.carouselWidget} about={data.unitData.about}/>
    } else {
      marquee = <MarqueeComp about={data.unitData.about} />
    }

    var seriesList = [];
    for (var s in data.content.series) {
      if (data.content.series[s].items.length > 0) {
        seriesList.push(<SeriesComp key={data.content.series[s].unit_id} data={data.content.series[s]}/>);
      }
    }

    return (
      <div>
        {marquee}
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <p>There are {data.unitData.extent.count} publications in this collection, published between {data.unitData.extent.pub_year.start} and {data.unitData.extent.pub_year.end}.</p>
              <h3>Journals by {data.unitData.name}</h3>
              <ul>
                { data.content.journals.map((child) =>
                  <li key={child.unit_id}><Link to={"/unit/"+child.unit_id}>{child.name}</Link></li>) }
              </ul>
              <h3>Works by {data.unitData.name}</h3>
              {seriesList}
              <hr/>
              <h3>Related Research Centers & Groups</h3>
              <ul>
                { data.content.related_orus.map((child) =>
                  <li key={child.unit_id}><Link to={"/unit/"+child.unit_id}>{child.name}</Link></li>) }
              </ul>
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

module.exports = DepartmentLayout