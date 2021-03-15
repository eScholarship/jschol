// ##### Check Color Contrast Component ##### //

import React from 'react'

function CheckContrastComp (props) {
  return (
    <div className="c-checkcontrast">
      <a href={`https://webaim.org/resources/contrastchecker/?fcolor=${props.checkForeground}&bcolor=${props.checkBackground}`}>Check that this element and background color combination passes WCAG AA accessibility for Normal Text at webaim.org.</a>
    </div>
  )
}

export default CheckContrastComp;
