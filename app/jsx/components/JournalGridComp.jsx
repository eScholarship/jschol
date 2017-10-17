// ##### Journal Grid Component ##### //

import React from 'react'
import { Link } from 'react-router'

class JournalGridComp extends React.Component {
  render() {
    return (
      <div className="c-journalgrid">
        <img src="/images/homecover_mester.png" alt="Mester journal"/>
        <img src="/images/homecover_interactions.png" alt="InterActions: UCLA Journal of Education and Information Studies Journal"/>
        <img src="/images/homecover_bpj.jpg" alt="Berkeley Planning Journal"/>
        <img src="/images/homecover_fb.png" alt="Frontiers of Biogeography Journal"/>
        <img src="/images/homecover_jcmrs.png" alt="Journal of Critical Mixed Race Studies Journal"/>
        <div className="c-journalgrid__all">
          <Link to="/journals">View all <strong>68</strong> current journals</Link>
        </div>
      </div>
    )
  }
}

module.exports = JournalGridComp;
