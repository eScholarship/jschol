// ##### Item Actions Component ##### //

// Within c-itemactions parent <div>, between 2 - 5 buttons or similar components can be used, as in example below.

// Styles that extend .o-button button object styles (like for applying custom button icons) should be placed in _itemactions.scss, as with the c-itemactions__button-[name] examples below:

import React from 'react'
import ShareComp from '../components/ShareComp.jsx'
import NotYetLink from '../components/NotYetLink.jsx'

class Downloadable extends React.Component {
  linkBuyPrint = () => {window.location = this.props.buy_link}

  render() {
    let p = this.props,
      contentVars = content_type => {
        let v = {
          'application/pdf': () => [ 'PDF', p.pdf_url, '.pdf' ],
          'text/html':       () => [ 'HTML', '' , '.html' ],
          'default':         () => [ 'Content', '' , '' ]
        }
        return v[content_type]()
      },
      x = p.content_type ? contentVars(p.content_type) : contentVars('default'),
      label = x[0],
      url = x[1],
      filename="eScholarship UC item " + p.id + x[2] 
    return (
      <div className="c-itemactions">
        <div className="o-download">
          {/* ToDo: Once main multimedia content is ingested, this button should say 'Download Content' */}
          { p.download_restricted
            ? <a href="" className="o-download__button" onClick={()=>{alert("Download restricted until " + p.download_restricted); return false}}>Download {label}</a>
            : <a href={url} className="o-download__button" download={filename}>Download {label}</a> }
          <details className="o-download__formats">
            <summary aria-label="formats"></summary>
            <ul className="o-download__nested-menu">
            {p.content_type && ["HTML", "PDF"].includes(label) &&
              <li className="o-download__nested-list1">
                Main
                <ul>
                {label=="PDF" && 
                  <li>
                    { p.download_restricted
                      ? <a href="" onClick={()=>{alert("Download restricted until " + p.download_restricted); return false}}>PDF</a>
                      : <a href={url} download={filename}>PDF</a> }
                  </li>
                }
                {label=="HTML" && 
                  [<li key="0"><NotYetLink element="a">ePub</NotYetLink></li>,
                  <li key="1"><NotYetLink element="a">HTML</NotYetLink></li>]
                }
                </ul>
              </li>
            }
              <li className="o-download__nested-list2">
                Citation
                <ul>
          {/*     <li><NotYetLink element="a">RIS</NotYetLink></li> 
                  <li><NotYetLink element="a">BibText</NotYetLink></li>   */}
                  <li><NotYetLink element="a">EndNote</NotYetLink></li>
          {/*     <li><NotYetLink element="a">RefWorks</NotYetLink></li>  */}
                </ul>
              </li>
          {/* p.supp_files &&
              <li className="o-download__nested-list3">
                Supplemental Material
                <ul>
                  <li><a href="">Image</a></li>
                  <li><a href="">Audio</a></li>
                  <li><a href="">Video</a></li>
                  <li><a href="">Zip</a></li>
                  <li><a href="">File</a></li>
                  <li><a href="">All Supplemental Material</a></li>
                </ul>
              </li>
          */}
            </ul>
          </details>
        </div>
      {p.buy_link &&
        <button onClick={() => {this.linkBuyPrint()}} className="c-itemactions__button-print">Buy in Print</button>
        // ToDo: Hook this up when we get eBook links
        // <button className="c-itemactions__button-buy">Buy e-Book</button>
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

class ItemActionsComp extends React.Component {
  render() {
    let p = this.props
    return (
      <div>
        {(["withdrawn", "embargoed"].includes(p.status) || !p.content_type) ?
           <Undownloadable id={p.id} />
         :
           <Downloadable {...p} />}
      </div>
    )
  }
}
        
module.exports = ItemActionsComp;
