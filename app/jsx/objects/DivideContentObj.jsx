// ##### Divide Content Objects ##### //

import React from 'react'
import faker from 'faker/locale/en'

class DivideContentObj extends React.Component {
  render() {
    return (
      <div>
        <h1>Divide Content into 2 Balanced Columns</h1>
        <div className="o-dividecontent2x">
          <img src="http://placehold.it/250x150?text=Image" alt="" />
          <p>{faker.fake("{{lorem.paragraphs}}")}</p>
          <p>{faker.fake("{{lorem.paragraphs}}")}</p>
          <p>{faker.fake("{{lorem.paragraphs}}")}</p>
        </div>
        <h1>Divide Content into 2 Balanced Columns with Rule</h1>
        <div className="o-dividecontent2x--ruled">
          <p>{faker.fake("{{lorem.paragraphs}}")}</p>
          <p>{faker.fake("{{lorem.paragraphs}}")}</p>
          <p>{faker.fake("{{lorem.paragraphs}}")}</p>
          <img src="http://placehold.it/250x150?text=Image" alt="" />
        </div>
      </div>
    )
  }
}

module.exports = DivideContentObj;
