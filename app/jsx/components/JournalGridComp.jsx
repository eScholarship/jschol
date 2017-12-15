// ##### Journal Grid Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import { Link } from 'react-router'

class JournalGridComp extends React.Component {
  render() {
    return (
      <div className="c-journalgrid">
        <LazyImageComp src="/images/homecover_mester.png" alt="Mester journal" />
        <LazyImageComp src="/images/homecover_interactions.png" alt="InterActions: UCLA Journal of Education and Information Studies Journal"/>
        <LazyImageComp src="/images/homecover_bpj.jpg" alt="Berkeley Planning Journal"/>
        <LazyImageComp src="/images/homecover_fb.png" alt="Frontiers of Biogeography Journal"/>
        <LazyImageComp src="/images/homecover_jcmrs.png" alt="Journal of Critical Mixed Race Studies Journal"/>
        <div className="c-journalgrid__all">
          <Link to="/journals">View all <strong>{this.props.count_journals}</strong> current journals</Link>
        </div>
      </div>
    )
  }
}

module.exports = JournalGridComp;
