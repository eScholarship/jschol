// ##### Item Actions Component ##### //

import React from 'react'
import ShareComp from '../components/ShareComp.jsx'

class ItemActionsComp extends React.Component {
  render() {
    let nodownload = (["withdrawn", "embargoed"].includes(this.props.status) || !this.props.content_type)
    return (
      <div>
        {nodownload ? <Undownloadable id={this.props.id} /> : <Downloadable id={this.props.id} />}
      </div>
    )
  }
}
        
class Downloadable extends React.Component {
  render() {
    return (
      <div className="c-itemactions">
        <div className="c-itemactions__download o-download">
          <button className="o-download__button">Download PDF</button>
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
        {/* buttons below can be omitted */}
        <button className="c-itemactions__button1 o-button__6">Buy in Print</button>
        <button className="c-itemactions__button2 o-button__6">Buy e-Book</button>
        <ShareComp type="item" id={this.props.id} />
      </div>
    )
  }
}

class Undownloadable extends React.Component {
  render() {
    return (
      <div className="c-itemactions">
        <div className="o-alert1" role="alert">This item is not available for download from eScholarship</div>
        <ShareComp type="item" id={this.props.id} />
      </div>
    )
  }
}

module.exports = ItemActionsComp;
