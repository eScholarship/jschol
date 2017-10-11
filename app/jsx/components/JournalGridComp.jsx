// ##### Journal Grid Component ##### //

import React from 'react'
import { Link } from 'react-router'

class JournalGridComp extends React.Component {
  render() {
    return (
      <div className="c-journalgrid">
        <img src="http://escholarship.org/issueCovers/ucla_spanport_mester/43_01_cover.png" alt="Mester journal"/>
        <img src="http://escholarship.org/issueCovers/gis_globalsocieties/05_00_cover.png" alt="Berkeley Review of Education journal"/>
        <img src="http://escholarship.org/issueCovers/ucb_crp_bpj/28_01_cover.png" alt="Berkeley Planning Journal"/>
        <img src="http://escholarship.org/issueCovers/anrcs_californiaagriculture/71_03_cover.png" alt="Californial Agriculture journal"/>
        <img src="http://escholarship.org/issueCovers/uclalaw_cllr/34_01_cover.png" alt="Chicana/o-Latina/o Law Review journal"/>
        <div className="c-journalgrid__all">
          <Link to="/journals">View all <strong>68</strong> current journals</Link>
        </div>
      </div>
    )
  }
}

module.exports = JournalGridComp;
