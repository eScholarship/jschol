// ##### Columns Layout Component ##### //

import React from 'react'
import faker from 'faker/locale/en'

class ColumnsComp extends React.Component {
  render() {
    return (
      <div>
        <h2>Example Using Left Sidebar with Main Content</h2>
        <div className="c-columns">
           <aside>
            <h3>Left Sidebar</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </aside>
          <main>
            <h3>Main Content</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </main>
        </div>

        <h2>Example Using Main Content with Right Sidebar</h2>

        <div className="c-columns">
          <main>
            <h3>Main Content</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </main>
          <aside>
            <h3>Right Sidebar</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </aside>
        </div>

        <h2>Example Using Split Main Content with Right Sidebar</h2>

        <div className="c-columns">
          <main>
            <h3>Main Content</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </main>
          <aside>
            <h3>Right Sidebar</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </aside>
        </div>

        <h2>Example Using Left and Right Sidebar with Main Content</h2>

        <div className="c-columns">
          <aside>
            <h3>Left Sidebar</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </aside>
          <main>
            <h3>Main Content</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </main>
          <aside>
            <h3>Right Sidebar</h3>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
            <p>{faker.fake("{{lorem.paragraph}}")}</p>
          </aside>
        </div>

      </div>
    )
  }
}

module.exports = ColumnsComp;
