// ##### Toggle Section Component ##### //

import React from 'react'
import faker from 'faker/locale/en'

class ToggleSectionComp extends React.Component {
  state={showContent: true}

  render() {
    return (
      <section className="c-togglesection">
        <header className={this.state.showContent ? 'c-togglesection__header--open' : 'c-togglesection__header'}>
        <h2>
          <button onClick={()=> this.setState({showContent: !this.state.showContent})}>Toggle Section Heading</button>
        </h2>
        </header>
        <div className="c-togglesection__content" hidden={!this.state.showContent}>
          {faker.fake("{{lorem.paragraph}}") + ' '}
          <a href="">{faker.fake("{{lorem.sentence}}") + ' '}</a>
          {faker.fake("{{lorem.paragraph}}")}
        </div>
      </section>
    )
  }
}

export default ToggleSectionComp;
