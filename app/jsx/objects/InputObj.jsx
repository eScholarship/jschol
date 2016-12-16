// ##### Input Objects ##### //

import React from 'react'

class InputObj extends React.Component {
  render() {
    return (
      <div>
        <h2>Droplists</h2>
        <div className="o-input__droplist">
          <label htmlFor="o-input__droplist-label">Fruit:</label>
          <select name="" id="o-input__droplist-label">
            <option value="">Apples</option>
            <option value="">Oranges</option>
            <option value="">Pears</option>
            <option value="">Grapes</option>
            <option value="">Strawberries</option>
          </select>
        </div>
      </div>
    )
  }
}

module.exports = InputObj;
