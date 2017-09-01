// ##### Download Object ##### //

import React from 'react'

class DownloadObj extends React.Component {
  render() {
    return (
      <div>
        <h2>Using Single Menu Items</h2>

        <div className="o-download">
          <a href="" className="o-download__button" download>Download All Files</a>
          <details className="o-download__formats">
            <summary aria-label="formats"></summary>
            <ul className="o-download__single-menu">
              <li><a href="">Image</a></li>
              <li><a href="">Audio</a></li>
              <li><a href="">Video</a></li>
              <li><a href="">Zip</a></li>
              <li><a href="">File</a></li>
            </ul>
          </details>
        </div>

        <h2>Using Nested Menu Items</h2>

        <div className="o-download">
          <a href="" className="o-download__button" download>Download PDF</a>
          <details className="o-download__formats">
            <summary aria-label="formats"></summary>
            <ul className="o-download__nested-menu">
              <li className="o-download__nested-list1">
                Main
                <ul>
                  <li><a href="">PDF</a></li>
                  <li><a href="">ePub</a></li>
                  <li><a href="">HTML</a></li>
                </ul>
              </li>
              <li className="o-download__nested-list2">
                Citation
                <ul>
                  <li><a href="">RIS</a></li>
                  <li><a href="">BibText</a></li>
                  <li><a href="">EndNote</a></li>
                  <li><a href="">RefWorks</a></li>
                </ul>
              </li>
              <li className="o-download__nested-list3">
                Supplemental Material
                <ul>
                  <li><a href="">Image</a></li>
                  <li><a href="">Audio</a></li>
                  <li><a href="">Video</a></li>
                  <li><a href="">Zip</a></li>
                  <li><a href="">File</a></li>
                </ul>
              </li>
            </ul>
          </details>
        </div>

      </div>
    )
  }
}

module.exports = DownloadObj;
