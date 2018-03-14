// ##### Tab Comments Component ##### //

import React from 'react'
import faker from 'faker/locale/en'

class TabCommentsComp extends React.Component {
  render() {
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Comments content to go here</h1>
        {faker.fake("{{lorem.paragraph}}")}
      </div>
    )
  }
}

module.exports = TabCommentsComp;
