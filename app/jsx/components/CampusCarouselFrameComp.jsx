// ##### Campus Carousel Frame Component ##### //

import React from 'react'

class CampusCarouselFrameComp extends React.Component {
  render() {
    return (
      <div className="c-campuscarouselframe">
        <h2 className="c-campuscarouselframe__heading"><a href="">Center for Medieval and Renaissance Studies</a></h2>
        <div className="c-campuscarouselframe__carousel">
          [journal or unit carousel to go here]
        </div>
        <div className="c-campuscarouselframe__stats">
          <div className="o-stat--item">
            <a href="">1,000</a>Items
          </div>
          <div className="o-stat--view">
            <b>100,000</b>Views
          </div>
        </div>
      </div>
    )
  }
}

export default CampusCarouselFrameComp;
