// ##### Journal Grid Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import { Link } from 'react-router'

class JournalGridComp extends React.Component {
  render() {
    return (
      <div className="c-journalgrid">
        <Link to="/uc/ucla_spanport_mester"><LazyImageComp src="/images/homecover_mester.png" alt="Mester journal" /></Link>
        <Link to="/uc/gseis_interactions"><LazyImageComp src="/images/homecover_interactions.png" alt="InterActions: UCLA Journal of Education and Information Studies Journal"/></Link>
        <Link to="/uc/ucb_crp_bpj"><LazyImageComp src="/images/homecover_bpj.jpg" alt="Berkeley Planning Journal"/></Link>
        <Link to="/uc/fb"><LazyImageComp src="/images/homecover_fb.png" alt="Frontiers of Biogeography Journal"/></Link>
        <Link to="/uc/ucsb_soc_jcmrs"><LazyImageComp src="/images/homecover_jcmrs.png" alt="Journal of Critical Mixed Race Studies Journal"/></Link>
        <div className="c-journalgrid__all">
          <Link to="/journals">View all <strong>{this.props.count_journals}</strong> current journals</Link>
        </div>
      </div>
    )
  }
}

module.exports = JournalGridComp;
