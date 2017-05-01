// ##### Item Actions Component ##### //

import React from 'react'
import ShareComp from '../components/ShareComp.jsx'

class ItemActionsComp extends React.Component {
  render() {
    let nodownload = (["withdrawn", "embargoed"].includes(this.props.status) || !this.props.content_type)
    return (
      <div>
        {nodownload ?
           <Undownloadable id={this.props.id} />
         :
           <Downloadable id={this.props.id}
                         content_type={this.props.content_type}
                         supp_files={this.props.supp_files}
                         buy_link={this.props.buy_link} />}
      </div>
    )
  }
}
        
class Downloadable extends React.Component {
  linkBuyPrint = () => {window.location = this.props.buy_link}

  contentLabel = {
      'application/pdf': 'PDF',
      'text/html':       'HTML',
      'default':         'Content'
  }

  render() {
    let p = this.props,
        label = this.contentLabel[p.content_type]
    return (
      <div className="c-itemactions">
        <div className="c-itemactions__download o-download">
          {/* ToDo: Once main multimedia content is ingested, this button should say 'Download Content' */}
          <button className="o-download__button">Download {label}</button>
          <details className="o-download__formats">
            <summary aria-label="formats"></summary>
            <ul className="o-download__nested-menu">
            {p.content_type && ["HTML", "PDF"].includes(label) &&
              <li className="o-download__nested-list1">
                Main
                <ul>
                {label=="PDF" && 
                  <li><a href="">PDF</a></li>
                }
                {label=="HTML" && 
                  [<li key="0"><a href="">ePub</a></li>,
                  <li key="1"><a href="">HTML</a></li>]
                }
                </ul>
              </li>
            }
              <li className="o-download__nested-list2">
                Citation
                <ul>
                  <li><a href="">RIS</a></li>
                  <li><a href="">BibText</a></li>
                  <li><a href="">EndNote</a></li>
                  <li><a href="">RefWorks</a></li>
                </ul>
              </li>
            {p.supp_files &&
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
            }
            </ul>
          </details>
        </div>
      {p.buy_link &&
        <button onClick={() => {this.linkBuyPrint()}} className="c-itemactions__button1 o-button__6">Buy in Print</button>
        // ToDo: Hook this up when we get eBook links
        // <button className="c-itemactions__button2 o-button__6">Buy e-Book</button>
      }
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
