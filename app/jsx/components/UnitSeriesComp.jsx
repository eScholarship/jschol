// ##### Unit Series Component ##### //

import React from 'react'
import $ from 'jquery'
import PubComp from '../components/PubComp.jsx'
import dotdotdot from 'jquery.dotdotdot'
import faker from 'faker/locale/en'

class UnitSeriesComp extends React.Component {
  componentDidMount() {
    $('.c-pub__heading, .c-pub__abstract').dotdotdot({watch: 'window', tolerance: 3,
    });
  }
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
