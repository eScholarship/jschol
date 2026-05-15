import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import MarqueeComp from '../components/MarqueeComp.jsx'
import ShareComp from '../components/ShareComp.jsx'
import PubComp from '../components/PubComp.jsx'

function SeriesComp({ data }) {
  const remaining = data.count - data.previewLimit
  const label = remaining === 1 ? "work" : "works"

  return (
    <div className="c-togglecontent c-unitseries">
      <Link to={`/uc/${data.unit_id}`}>{data.name} ({data.count})</Link>
      <details>
        <summary aria-label={`Toggle items for ${data.name}`}></summary>
        {data.items.map((item) =>
          <PubComp key={item.id} result={item} h="h3" />) }
        {remaining > 0 &&
          <div className="c-unitseries__publications2">
            {remaining} more {label} &mdash;{" "}
            <Link to={`/uc/${data.unit_id}`}>show all</Link>
          </div> 
        }
      </details>
    </div>
  )
}

SeriesComp.propTypes = {
  data: PropTypes.shape({
    unit_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    previewLimit: PropTypes.number.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      abstract: PropTypes.string,
      authors: PropTypes.array,
      content_type: PropTypes.string,
      supp_files: PropTypes.array
    })).isRequired
  })
}

function DepartmentLayout({ unit, data, marquee, sidebar }) {
  const seriesList = data.series.filter(s => s.items.length > 0)
  const monographSeriesList = data.monograph_series.filter(s => s.items.length > 0)

  const unitLists = [
    { heading: "Journals", items: data.journals },
    { heading: "Conference Proceedings", items: data.conference_proceedings },
    { heading: "Related Research Centers & Groups", items: data.related_orus },
  ].filter(({ items }) => items.length > 0)

  return (
    <div>
    {((marquee.carousel && marquee.slides) || marquee.about) &&
      <MarqueeComp marquee={marquee} />
    }
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h2>{unit.name}</h2>
            </header>
            <div className="c-itemactions">
              <ShareComp type="unit" id={unit.id} />
            </div>
            <div className="c-unitseries__publications1">
              {unit.extent.count === 0
                ? "There are currently no publications in this collection."
                : `There are ${unit.extent.count} publications in this collection, published between ${unit.extent.pub_year.start} and ${unit.extent.pub_year.end}.`
              }
            </div>
            {seriesList.length > 0 && seriesList.map(s =>
              <SeriesComp key={s.unit_id} data={s} />)}
            {monographSeriesList.length > 0 && monographSeriesList.map(s =>
              <SeriesComp key={s.unit_id} data={s} />)}
            {unitLists.map(({ heading, items }) =>
              <div key={heading} className="c-unitlist">
                <h3>{heading}</h3>
                <ul>
                  {items.map(child =>
                    <li key={child.unit_id}><Link to={`/uc/${child.unit_id}`}>{child.name}</Link></li>
                  )}
                </ul>
              </div>
            )}
          </section>
        </main>
        <aside>
          {sidebar}
        </aside>
      </div>
    </div>
  )
}

DepartmentLayout.propTypes = {
  unit: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    extent: PropTypes.object
  }).isRequired,
  data: PropTypes.shape({
    series: PropTypes.array.isRequired,
    monograph_series: PropTypes.array.isRequired,
    journals: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      unit_id: PropTypes.string
    })),
    conference_proceedings: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      unit_id: PropTypes.string
    })),
    related_orus: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      unit_id: PropTypes.string
    })),
  }).isRequired,
  marquee: PropTypes.shape({
    carousel: PropTypes.any,
    about: PropTypes.about
  })
}

export default DepartmentLayout
