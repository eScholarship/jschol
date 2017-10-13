// ##### Item Actions Component ##### //

// Within c-itemactions parent <div>, between 2 - 5 buttons or similar components can be used, as in example below.

// Styles that extend .o-button button object styles (like for applying custom button icons) should be placed in _itemactions.scss, as with the c-itemactions__button-[name] examples below:

import React from 'react'
import ShareComp from '../components/ShareComp.jsx'
import { DropdownMenu, Menu_a, Menu_NotYetLink } from '../components/DropdownMenu.jsx'

class ItemActionsComp extends React.Component {
  render() {
    let p = this.props
    return (
      <div>
        {(["withdrawn", "embargoed"].includes(p.status) || !p.content_type) ?
           <Undownloadable id={p.id} />
         :
           <Downloadable id={p.id}
                         content_type={p.content_type}
                         supp_files={p.supp_files}
                         buy_link={p.buy_link}
                         download_restricted={p.download_restricted}/>}
      </div>
    )
  }
}

class Downloadable extends React.Component {
  linkBuyPrint = () => {window.location = this.props.buy_link}

  render() {
    let p = this.props,
      contentVars = content_type => {
        let v = {
          'application/pdf': () => [ 'PDF', "/content/qt" + p.id + "/qt" + p.id + ".pdf", '.pdf' ],
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
          <DropdownMenu detailsClass="o-download__formats" ariaLabel="formats">
            <ul className="o-download__nested-menu">
            {p.content_type && ["HTML", "PDF"].includes(label) &&
              <li className="o-download__nested-list1">
                Main
                <ul>
                {label=="PDF" && 
                  <li>
                    { p.download_restricted
                      ? <Menu_a href="" onClick={()=>{alert("Download restricted until " + p.download_restricted); return false}}>PDF</Menu_a>
                      : <Menu_a href={url} download={filename}>PDF</Menu_a> }
                  </li>
                }
                {label=="HTML" && 
                  [<li key="0"><Menu_NotYetLink element="a">ePub</Menu_NotYetLink></li>,
                  <li key="1"><Menu_NotYetLink element="a">HTML</Menu_NotYetLink></li>]
                }
                </ul>
              </li>
            }
              <li className="o-download__nested-list2">
                Citation
                <ul>
          {/*     <li><Menu_NotYetLink element="a">RIS</Menu_NotYetLink></li>
                  <li><Menu_NotYetLink element="a">BibText</Menu_NotYetLink></li>   */}
                  <li><Menu_NotYetLink element="a">EndNote</Menu_NotYetLink></li>
          {/*     <li><Menu_NotYetLink element="a">RefWorks</Menu_NotYetLink></li>  */}
                </ul>
              </li>
          {/* p.supp_files &&
              <li className="o-download__nested-list3">
                Supplemental Material
                <ul>
                  <li><Menu_a href="">Image</Menu_a></li>
                  <li><Menu_a href="">Audio</Menu_a></li>
                  <li><Menu_a href="">Video</Menu_a></li>
                  <li><Menu_a href="">Zip</Menu_a></li>
                  <li><Menu_a href="">File</Menu_a></li>
                  <li><Menu_a href="">All Supplemental Material</Menu_a></li>
                </ul>
              </li>
          */}
            </ul>
          </DropdownMenu>
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

module.exports = ItemActionsComp;
