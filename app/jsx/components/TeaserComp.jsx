// ##### Teaser Component ##### //

import React from 'react'
import { Link } from 'react-router'

class TeaserComp extends React.Component {
  render() {
    return (
      <div className="c-teaser">
        <section>
          <header>
            <h2>eScholarship Repository</h2>
          </header>
          <p>Illum officiis eos animi blanditiis dolores aliquam quia eum expedita beatae iste alias.
          </p>
          <a href="#repository">Learn more</a>
        </section>
        <section>
          <header>
            <h2>eScholarship Publishing</h2>
          </header>
          <p>Quod dolorem, nostrum ad quas quam doloribus labore quia a modi officiis unde natus.
          </p>
          <a href="#publishing">Learn more</a>
        </section>
      </div>
    )
  }
}

module.exports = TeaserComp;
