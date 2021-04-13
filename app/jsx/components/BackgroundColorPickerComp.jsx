// ##### Background Color Picker Component ##### //

import React from 'react'

function BackgroundColorPickerComp (props) {
  function handleChange(e) {
    props.onBackgroundColorChange(e.target.value)
  }

  return (
    <div className="c-backgroundcolorpicker">
      <label htmlFor="subheader-bgcolorpicker">{props.textLabel}:</label>
      <input id="subheader-bgcolorpicker" type="color" value={props.backgroundColor} onChange={handleChange} />
    </div>
  )
}

export default  BackgroundColorPickerComp;
