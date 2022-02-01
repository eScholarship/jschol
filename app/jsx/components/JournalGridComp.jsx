// ##### Journal Grid Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import { Link } from 'react-router-dom'
import MEDIA_PATH from '../../js/MediaPath.js'

class JournalGridComp extends React.Component {
  render() {
    return (
      <div className="c-journalgrid">
        <Link to="/uc/anrcs_californiaagriculture"><LazyImageComp src={MEDIA_PATH + 'homecover_CalAg.png'} alt="California Agriculture journal" /></Link>
        <Link to="/uc/psf"><LazyImageComp src={MEDIA_PATH + 'homecover_psf.png'} alt="Parks Stewardship Forum"/></Link>
        <Link to="/uc/our_bsj"><LazyImageComp src={MEDIA_PATH + 'homecover_glitch.png'} alt="Berkeley Scientific Journal"/></Link>
        <Link to="/uc/alephucla"><LazyImageComp src={MEDIA_PATH + 'homecover_aleph.png'} alt="Aleph, UCLA Undergraduate Research Journal"/></Link>
        <Link to="/uc/alonfilipinxjournal"><LazyImageComp src={MEDIA_PATH + 'homecover_af.png'} alt="Alon: Journal for Filipinx American and Diasporic Studies"/></Link>
        <div className="c-journalgrid__all">
          <Link to="/journals">View all <strong>{this.props.count_journals}</strong> current journals</Link>
        </div>
      </div>
    )
  }
}

export default JournalGridComp;
