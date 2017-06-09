// ##### Description List Component ##### //

import React from 'react'
import { Link } from 'react-router'

// StatNum displays stats (# publications, # depts, # journals) for a given campus or affilated unit
class StatNum extends React.Component {

  // Returns an array: [any present?, more than one?]
  statNumify(x) {
    return [ x  ? x.toLocaleString() : null,
            x>1 ? 's' : '']
  }

  render() {
    let s1 = this.statNumify(this.props.item["publications"]),
        s2 = this.statNumify(this.props.item["units"]),
        s3 = this.statNumify(this.props.item["journals"])
    return (
      <dd>
        {s1[0] && <span>{s1[0]} Publication{s1[1]}</span>}
        {s2[0] && <span>, {s2[0]} Unit{s2[1]}</span>}
        {s3[0] && <span>, {s3[0]} Journal{s3[1]}</span>}
      </dd>
    )
  }
}

class DescriptionListComp extends React.Component {
  render() {
    return (
      <div>
        <dl className="c-descriptionlist">
          {this.props.campusesStats.map(function(c, i) {
            return c['id'] != "" &&
              [<dt key={i}><Link to={"/uc/" + c['id']}>{c['name']}</Link></dt>, 
               <StatNum key="99" item={c} />]
          })}
        </dl>
        <h3>Affiliated Units</h3>
        <dl className="c-descriptionlist">
          {this.props.affiliatedStats.map(function(c, i) {
            return c['id'] != "" &&
              [<dt key={i}><Link to={"/uc/" + c['id']}>{c['name']}</Link></dt>, 
              <StatNum key="99" item={c} />]
          })}
        </dl>
      </div>
    )
  }
}

module.exports = DescriptionListComp;
