// ##### Column Box Objects ##### //

import React from 'react'
import faker from 'faker/locale/en'
import TruncationObj from '../objects/TruncationObj.jsx'

class ColumnBoxObj extends React.Component {
  state={
    loadingData: false
  }

  render() {
    return (
      <div>
        
        <h2>Column Box 1</h2>

        <h3>Standard Styling</h3>
        <section className="o-columnbox1">
          <header>
            <h2>About eScholarship</h2>
          </header>
          <p>
            {faker.fake("{{lorem.paragraphs}}")}
          </p>
        </section>

        <h3>Includes Overlay Class with Simulation for Loading Search Results: <button onClick={()=> this.setState({loadingData: true})}>Start Loading</button><button onClick={()=> this.setState({loadingData: false})}>End Loading</button></h3>

        {/* For integration, replace simulation logic below with back-end logic that toggles the class 'is-loading-data' upon ajax request */}
        <section className={this.state.loadingData ? "o-columnbox1 is-loading-data" : "o-columnbox1"}>
          <header>
            <h2>About eScholarship</h2>
          </header>
          {faker.fake("{{lorem.paragraph}}") + ' '}
            <a href="">{faker.fake("{{lorem.sentence}}")}</a>
          {' ' + faker.fake("{{lorem.paragraph}}")}
        </section>

        <h3>Containing Responsive Image Content</h3>
        <section className="o-columnbox1">
          <header>
            <h2>About eScholarship</h2>
          </header>
          <p>
            {faker.fake("{{lorem.paragraphs}}")}
          </p>
          <img src="http://via.placeholder.com/500x200?text=Image (max-width: 100%)" alt=""/>
        </section>

        <h3>Truncated to 5 lines</h3>
        <section className="o-columnbox1">
          <header>
            <h2>About eScholarship</h2>
          </header>
          <TruncationObj 
            element="div"
            className="o-columnbox"
            expandable={true}
            buttonClassName="o-columnbox__truncate-more"
          >
            <div>
              {faker.fake("{{lorem.paragraphs}}")}
            </div>
          </TruncationObj>
        </section>

        <h3>When Placed Within Sidebar</h3>
        <aside>
          <section className="o-columnbox1">
            <header>
              <h2>About eScholarship</h2>
            </header>
            {faker.fake("{{lorem.paragraphs}}")}
          </section>
          <section className="o-columnbox1">
            <header>
              <h2>About eScholarship</h2>
            </header>
            {faker.fake("{{lorem.paragraphs}}")}
          </section>
        </aside>

        <h2>Column Box 1 Without Section Header</h2>
        <section className="o-columnbox1">
          {faker.fake("{{lorem.paragraphs}}")}
        </section>

        <h3>When Placed Within Sidebar</h3>
        <aside>
          <section className="o-columnbox1">
            {faker.fake("{{lorem.paragraphs}}")}
          </section>
        </aside>

        <h2>Column Box 2 (Column Box 1 Without Background and Box Shadow)</h2>
        <section className="o-columnbox2">
          <header>
            <h2>About eScholarship</h2>
          </header>
          {faker.fake("{{lorem.paragraphs}}")}
        </section>

        <h3>When Placed Within Sidebar</h3>
        <aside>
          <section className="o-columnbox2">
            <header>
              <h2>About eScholarship</h2>
            </header>
            {faker.fake("{{lorem.paragraphs}}")}
          </section>
        </aside>

      </div>
    )
  }
}

export default ColumnBoxObj;
