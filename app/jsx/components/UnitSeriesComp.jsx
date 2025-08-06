// ##### Unit Series Component ##### //

import React from 'react'
import PubComp from '../components/PubComp.jsx'
import faker from 'faker/locale/en'

class UnitSeriesComp extends React.Component {
  render() {
    return (
      <details className="c-togglecontent c-unitseries">
        <summary><a href="">{this.props.heading} ({faker.fake("{{random.number(99)}}")})</a></summary>
        <PubComp headingLevel="5" />
        <PubComp headingLevel="5" />
        <PubComp headingLevel="5" />
        <div className="c-unitseries__publications2">{faker.fake("{{random.number(99)}}")} more works&mdash; <a href="">show all</a></div>
      </details>
    )
  }
}

export default UnitSeriesComp;
