// ##### Checkbox Component ##### //

import React from 'react'

class CheckboxComp extends React.Component {
  render() {
    return (
      <ul className="c-checkbox">
        {/* 'id' and 'htmlFor' values must contain a unique number per each pair below for accessibility */}
        <li>
          <input id="c-checkbox__number1" type="checkbox" className="c-checkbox__input"/>
          <label htmlFor="c-checkbox__number1" className="c-checkbox__label">Agricultural History Center (##)</label>
        </li>
        <li>
          <input id="c-checkbox__number2" type="checkbox" className="c-checkbox__input"/>
          <label htmlFor="c-checkbox__number2" className="c-checkbox__label">Agriculture and Natural Resources Research and Extension Centers (##)</label>
          <ul>
            <li>
              <input id="c-checkbox__number3" type="checkbox" className="c-checkbox__input"/>
              <label htmlFor="c-checkbox__number3" className="c-checkbox__label">Hopland Research and Extension Center (##)</label>
            </li>
            <li>
              <input id="c-checkbox__number4" type="checkbox" className="c-checkbox__input"/>
              <label htmlFor="c-checkbox__number4" className="c-checkbox__label">Sierra Foothill Research and Extension Center (##)</label>
            </li>
          </ul>
        </li>
        <li>
          <input id="c-checkbox__number5" type="checkbox" className="c-checkbox__input"/>
          <label htmlFor="c-checkbox__number5" className="c-checkbox__label">Western Journal of Emergency Medicine: Integrating Emergency Care with Population Health</label>
        </li>
        <li>
          <input id="c-checkbox__number6" type="checkbox" className="c-checkbox__input"/>
          <label htmlFor="c-checkbox__number6" className="c-checkbox__label">PDF</label>
        </li>
        <li>
          <input id="c-checkbox__number7" type="checkbox" className="c-checkbox__input"/>
          <label htmlFor="c-checkbox__number7" className="c-checkbox__label">ZIP</label>
        </li>
      </ul>
    )
  }
}

module.exports = CheckboxComp;
