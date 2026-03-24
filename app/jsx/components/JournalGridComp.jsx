// ##### Journal Grid Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import { Link } from 'react-router-dom'
import MEDIA_PATH from '../../js/MediaPath.js'
import { featuredJournals } from '../../consts/featuredJournals.js'

function JournalGridComp({ count_journals }) {
  return (
    <div className="c-journalgrid">
      {featuredJournals.map(({ path, image, alt }) => (
        <Link key={path} to={path}>
          <LazyImageComp src={MEDIA_PATH + image} alt={alt} />
        </Link>
      ))}
      <div className="c-journalgrid__all">
        <Link to="/journals">View all <strong>{count_journals}</strong> current journals</Link>
      </div>
    </div>
  )
}

export default JournalGridComp;
