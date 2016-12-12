// ##### Column Box Objects ##### //

import React from 'react'

class ColumnBoxObj extends React.Component {
  render() {
    return (
      <div>
        <h2>Main Column Box</h2>
        <section className="o-columnbox-main">
          <header>
            <h2 className="o-columnbox-main__heading">About eScholarship</h2>
          </header>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </p>
        </section>
        <h2>Sidebar Column Box</h2>
        <section className="o-columnbox-sidebar">
          <header>
            <h2 className="o-columnbox-sidebar__heading">Placeholder Title</h2>
          </header>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </p>
        </section>
      </div>
    )
  }
}

module.exports = ColumnBoxObj;
