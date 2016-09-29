// ##### Checkbox Component ##### //

import React from 'react'

class CheckboxComp extends React.Component {
  render() {
		return (
			<div className="c-checkbox">
				<input id="c-checkbox__number1" type="checkbox" className="c-checkbox__input"/>
				<label htmlFor="c-checkbox__number1" className="c-checkbox__label">Video</label>

				<input id="c-checkbox__number2" type="checkbox" className="c-checkbox__input"/>
				<label htmlFor="c-checkbox__number2" className="c-checkbox__label">Audio</label>
				
				<input id="c-checkbox__number3" type="checkbox" className="c-checkbox__input"/>
				<label htmlFor="c-checkbox__number3" className="c-checkbox__label">images</label>
				
				<input id="c-checkbox__number4" type="checkbox" className="c-checkbox__input"/>
				<label htmlFor="c-checkbox__number4" className="c-checkbox__label">PDF</label>
				
				<input id="c-checkbox__number5" type="checkbox" className="c-checkbox__input"/>
				<label htmlFor="c-checkbox__number5" className="c-checkbox__label">ZIP</label>
			</div>
		)
	}
}

module.exports = CheckboxComp;
