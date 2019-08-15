// ##### Text List Objects ##### //

import React from 'react'
import faker from 'faker/locale/en'

class TextListObj extends React.Component {
  render() {
    return (
      <div>

        <h1>Bulleted List</h1>

        <ul className="o-textlist1">
          <li>{faker.fake("{{lorem.words}}")}</li>
          <li>{faker.fake("{{lorem.words}}")} <a href="">{faker.fake("{{lorem.words}}")}</a>
          </li>
          <li>{faker.fake("{{lorem.words}}")}</li>
          <li>{faker.fake("{{lorem.words}}")}</li>
          <li>{faker.fake("{{lorem.words}}")}</li>
        </ul>

        <h1>Non-bulleted List</h1>

        <ul className="o-textlist2">
          <li>{faker.fake("{{lorem.words}}")}</li>
          <li>{faker.fake("{{lorem.words}}")}</li>
          <li>{faker.fake("{{lorem.words}}")}</li>
          <li>{faker.fake("{{lorem.words}}")}</li>
          <li>{faker.fake("{{lorem.words}}")}</li>
        </ul>

      </div>
    )
  }
}

export default TextListObj;
