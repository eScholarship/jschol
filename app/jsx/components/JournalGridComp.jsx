// ##### Journal Grid Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import { Link } from 'react-router-dom'
import MEDIA_PATH from '../../js/MediaPath.js'

class JournalGridComp extends React.Component {
  render() {
    return (
      <div className="c-journalgrid">
        <Link to="/uc/anrcs_californiaagriculture"><LazyImageComp src={MEDIA_PATH + 'homecover_CalAg.wbm'} alt="California Agriculture" /></Link>
        <Link to="/uc/psf"><LazyImageComp src={MEDIA_PATH + 'homecover_psf.wbm'} alt="Parks Stewardship Forum"/></Link>
        <Link to="/uc/jmie_sfews"><LazyImageComp src={MEDIA_PATH + 'homecover_sfews.wbm'} alt="San Francisco Estuary and Watershed Science"/></Link>
        <Link to="/uc/jrws"><LazyImageComp src={MEDIA_PATH + 'homecover_jrws.wbm'} alt="Journal of Right-Wing Studies"/></Link>
        <Link to="/uc/aicrj"><LazyImageComp src={MEDIA_PATH + 'homecover_aicrj.wbm'} alt="American Indian Culture and Research Journal"/></Link>
        <div className="c-journalgrid__all">
          <Link to="/journals">View all <strong>{this.props.count_journals}</strong> current journals</Link>
        </div>
      </div>
    )
  }
}

export default JournalGridComp;
