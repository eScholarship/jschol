import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

class UnitStaticPageLayout extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      attrs: PropTypes.shape({
        html: PropTypes.string.isRequired
      })
    }),
    sidebar: PropTypes.object.isRequired
  }

  render() {
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">{this.props.data.title}</h1>
            </header>
            <div dangerouslySetInnerHTML={{__html: this.props.data.attrs.html}}/>
          </section>
        </main>
        <aside>
          {this.props.sidebar}
        </aside>
      </div>
    )
  }
}

module.exports = UnitStaticPageLayout
