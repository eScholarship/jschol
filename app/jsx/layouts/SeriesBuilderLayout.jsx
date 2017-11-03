import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

export default class SeriesBuilderLayout extends React.Component
{
  static propTypes = {
    data: PropTypes.shape({
      // TODO
    }).isRequired,
    sendApiData: PropTypes.func.isRequired,
  }

  onAdd = event => {
    const id = parseInt(event.target.dataset.id)
    this.props.sendApiData("POST", `/api/redirect/${this.props.data.kind}`,
      { from_path: $('#from-new')[0].value,
        to_path:   $('#to-new')[0].value,
        descrip:   $('#descrip-new')[0].value })
  }

  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">
                Series Builder
              </h1>
            </header>
            <p>TODO</p>
          </section>
        </main>
      </div>
    )
  }
}
