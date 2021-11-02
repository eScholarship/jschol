// ##### Item Actions Component ##### //

// Within c-itemactions parent <div>, between 2 - 5 buttons or similar components can be used, as in example below.

// Styles that extend .o-button button object styles (like for applying custom button icons) should be placed in _itemactions.scss, as with the c-itemactions__button-[name] examples below:

import React from 'react'
import PropTypes from 'prop-types'
import ShareComp from '../components/ShareComp.jsx'
import NotYetLink from '../components/NotYetLink.jsx'
import DropdownMenu from '../components/DropdownMenu.jsx'
import WithdrawModalComp from '../components/WithdrawModalComp.jsx'
import { Link } from 'react-router-dom'

class Downloadable extends React.Component {
  linkBuyPrint = () => {window.location = this.props.attrs.buy_link}

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
      filename="eScholarship UC item " + p.id + x[2],

      is_glossa=(p.journal_id == 'glossapsycholinguistics'
		 && (p.attrs.supp_files ? p.attrs.supp_files.filter(f => f.file == ('qt' + p.id + '.pdf')).length == 1 : false)
		 && (p.attrs.supp_files ? p.attrs.supp_files.filter(f => f.file == ('qt' + p.id + '.xml')).length == 1 : false))

      if(is_glossa) {
	  let file_path = (p.preview_key ? "/preview/" : "/content/") +  "qt" + p.id + "/supp/",
	      pk = (p.preview_key ? "?preview_key=" + p.preview_key : ""),
	      pdf_url = file_path + "qt" + p.id + ".pdf" + pk,
	      xml_url = file_path + "qt" + p.id + ".xml" + pk,
	      pdf_file = "eScholarship UC item " + p.id + ".pdf",
	      xml_file = "eScholarship UC item " + p.id + ".xml"

	  return (
      <div className="c-itemactions">
        <div className="o-download">
          {p.download_restricted
              ? <a href={pdf_url} className="o-download__button" onClick={()=>{alert("Download restricted until " + p.download_restricted); return false}}>Download PDF</a>
          : <a href={pdf_url} className="o-download__button" download={pdf_file}>Download PDF</a> }
          <DropdownMenu detailsClass="o-download__formats" ariaLabel="formats">
		<ul className="o-download__nested-menu">
		  <li className="o-download__nested-list1">
	            Main
		    <ul>
		      <li>
			{ p.download_restricted
			    ? <a href={pdf_url} onClick={()=>{alert("Download restricted until " + p.download_restricted); return false}}>PDF</a>
			: <a href={pdf_url} download={pdf_file}>PDF</a>}
                      </li>
                      <li>
			{ p.download_restricted
			    ? <a href={xml_url} onClick={()=>{alert("Download restricted until " + p.download_restricted); return false}}>XML</a>
			: <a href={xml_url} download={xml_file}>XML</a> }
                      </li>
		    </ul>
	          </li>
		</ul>
	  </DropdownMenu>
	</div>
        <ShareComp type="item" id={this.props.id} />
      </div>
	  )
      }
  else {
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
              {/*    <li className="o-download__nested-list2">
                Citation
                <ul>
               <li><NotYetLink element="a">RIS</NotYetLink></li>
                  <li><NotYetLink element="a">BibText</NotYetLink></li>   
                  <li><NotYetLink element="a">EndNote</NotYetLink></li>
               <li><NotYetLink element="a">RefWorks</NotYetLink></li> 
                </ul>
              </li> */}
          {/* p.attrs.supp_files &&
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
          </DropdownMenu>
        </div>
        <WithdrawModalComp itemID={this.props.id} sendApiData={this.props.sendApiData}/>
      {p.attrs.buy_link &&
        <button onClick={() => {this.linkBuyPrint()}} className="c-itemactions__button-print">Buy in Print</button>
        // ToDo: Hook this up when we get eBook links
        // <button className="c-itemactions__button-buy">Buy e-Book</button>
      }
        <ShareComp type="item" id={this.props.id} />
      </div>
     )
    }
  }
}

// For withdrawn, embargoed, or items with no content_type,
// with one exception: "multimedia item", which is a published item with no content type
// and no published web location, but with supplemental media.
class Undownloadable extends React.Component {
  render() {
    let p = this.props
    let multimediaItem = p.status=='published' && !p.content_type && !p.attrs.pub_web_loc && p.attrs.supp_files && p.attrs.supp_files.length > 0
    // ToDo: For multimedia content, add functionality to zip up supp files for download, and put button here (like Downloadable class above) that says 'Download Content' */}
    let msg = !multimediaItem ?
                <div className="o-alert1" role="alert">
                  {p.status=='pending' ?
                      "This item has not yet been published on eScholarship"
                   : p.attrs.withdrawn_message ?
                      p.attrs.withdrawn_message
                   : "This item is not available for download from eScholarship"
                  }
                </div>
              :
                null
    return (
      <div className="c-itemactions">
        {msg}
      {!/withdrawn/.test(p.status) &&
        <WithdrawModalComp itemID={this.props.id}
                           fetchingData={this.props.fetchingData} sendApiData={this.props.sendApiData}/>
      }
      {!/withdrawn|pending/.test(p.status) ?
        <ShareComp type="item" id={p.id} />
      :
        <div className="c-share">{/* Keep this div here to allow sister element 'o-alert1' to be aligned properly to the left */}</div>
      }
      </div>
    )
  }
}

class ItemActionsComp extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    content_type: PropTypes.string,
    pdf_url: PropTypes.string,
    attrs: PropTypes.any,
    download_restricted: PropTypes.bool,
  }

  render() {
    let p = this.props
    return (
      <div>
        {(p.status != "published" || !p.content_type) ?
           <Undownloadable {...p} />
         :
           <Downloadable {...p} />}
      </div>
    )
  }
}
        
export default ItemActionsComp;
