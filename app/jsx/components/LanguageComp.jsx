// ##### Language Component ##### //

import React from 'react'

class LanguageComp extends React.Component {
  render() {
    return (
      <div className="c-language">
        <a href="" className="o-textlink__primary">
          <abbr className="c-language__small-label" title="Español">ES</abbr>
          <span className="c-language__large-label">Español</span>
        </a>
        <a href="" className="o-textlink__primary">
          <abbr className="c-language__small-label" title="Português">PT</abbr>
          <span className="c-language__large-label">Português</span>
        </a>
      </div>
    )
  }
}

export default LanguageComp;
