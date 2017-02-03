// ##### Download Component ##### //

import React from 'react'

class DownloadComp extends React.Component {
  render() {
    return (
      <div className="c-download">
        <button className="c-download__button">Download PDF</button>
        <details className="c-download__formats">
          <summary aria-label="formats"></summary>
          <div className="c-download__menu">
            <div className="c-download__heading1" id="c-download__list1">
              Main
            </div>
            <ul className="c-download__list" aria-labelledby="c-download__list1">
              <li><a href="">PDF</a></li>
              <li><a href="">ePub</a></li>
              <li><a href="">HTML</a></li>
            </ul>
            <div className="c-download__heading2" id="c-download__list2">
              Citation
            </div>
            <ul className="c-download__list" aria-labelledby="c-download__list2">
              <li><a href="">RIS</a></li>
              <li><a href="">BibText</a></li>
              <li><a href="">EndNote</a></li>
              <li><a href="">RefWorks</a></li>
            </ul>
            <div className="c-download__heading3" id="c-download__list3">
              Supplemental Material
            </div>
            <ul className="c-download__list" aria-labelledby="c-download__list3">
              <li><a href="">Image</a></li>
              <li><a href="">Audio</a></li>
              <li><a href="">Video</a></li>
              <li><a href="">Zip</a></li>
              <li><a href="">File</a></li>
            </ul>
          </div>
        </details>
      </div>
    )
  }
}

module.exports = DownloadComp;
