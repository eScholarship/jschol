// ##### Item Page ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import ItemActionsComp from '../components/ItemActionsComp.jsx'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import AuthorListComp from '../components/AuthorListComp.jsx'
import PdfViewComp from '../components/PdfViewComp.jsx'
import PubLocationComp from '../components/PubLocationComp.jsx'
import PubDataComp from '../components/PubDataComp.jsx'
import TabsComp from '../components/TabsComp.jsx'
import JumpComp from '../components/JumpComp.jsx'
import SidebarComp from '../components/SidebarComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

const tab_anchors = ['main', 'supplemental', 'metrics', 'author']
const anchors = tab_anchors.concat(['article_abstract', 'article_main', 'article_references'])

const MONTHS = [ "January", "Februrary", "March",
                 "April", "May", "June",
                 "July", "August", "September",
                 "October", "November", "December" ]

class ItemPage extends PageBase {
  static propTypes = {
    currentTab: PropTypes.oneOf(anchors)
  }

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/item/" + this.props.params.itemID
  }

  tabNameFromHash() {
    return !(typeof location === "undefined") ? location.hash.toLowerCase().replace(/^#/, "") : ""
  }

  // currentTab should be 'main' whenever hash starts with 'article_" (or is empty)
  articleHashHandler = h => { return ((h.startsWith("article") || h=='') ? "main" : h) }

  state = { currentTab: this.articleHashHandler(this.tabNameFromHash()) }

  componentDidMount() {
    // Check hash whenever back or forward button clicked
    window.onpopstate = (event) => {
      var h = this.articleHashHandler(this.tabNameFromHash())
      if ((h != this.state.currentTab) && anchors.includes(h)) {
        this.setState({currentTab: h})
      }
    }
  }

  formatDate = d => {
    if (d) {
      // The Javascript API for the Date object is incredibly horrible:
      // 1. It assumes UTC at strange times
      // 2. Months are numbered starting from 0. Who ever heard of 0=January?
      // 3. getDay() returns day *of the week*. getDate() is day-of-month.
      // It's just so crazy. So, let's just parse and format manually.
      let m = /^(\d\d\d\d)-(\d\d)-(\d\d)$/.exec(d)
      if (m == null)
        return d // fall back if we can't parse it
      let year = parseInt(m[1])
      let month = parseInt(m[2])
      let day = parseInt(m[3])
      return `${MONTHS[month-1]} ${day}, ${year}`
    }
    else {
      return new Date().toLocaleString("en-us", { year: "numeric", month: "long", day: "numeric" })
    }
  }

  changeTab = tabName => {
    this.setState({currentTab: this.articleHashHandler(tabName) })
    // Set hash based on what was clicked.
    window.location.hash=tabName
  }

  renderData = data => {
    let currentTab = tab_anchors.includes(this.state.currentTab) ? this.state.currentTab : "main" 
    let d = data
    let a = d.attrs
    let meta_authors = d.authors.slice(0, 85).map(function(author, i) {
      return <meta key={i} id={"meta-author"+i} name="citation_author" content={author.name}/>
     })
    let [issn, volume, issue, firstpage, lastpage] = [null, null, null, null, null]
    if (a['ext_journal']) {
      let extj = a['ext_journal']
      issn = extj['issn'] && <meta id="meta-issn" name="citation_issn" content={extj['issn']}/>
      volume = extj['volume'] && <meta id="meta-volume" name="citation_volume" content={extj['volume']}/>
      issue = extj['issue'] && <meta id="meta-issue" name="citation_issue" content={extj['issue']}/>
      firstpage = extj['fpage'] && <meta id="meta-firstpage" name="citation_firstpage" content={extj['fpage']}/>
      lastpage = extj['lpage'] && <meta id="meta-lastpage" name="citation_lastpage" content={extj['lpage']}/>
    } else if (d.citation) {
      let c = d.citation
      issn = c['issn'] && <meta id="meta-issn" name="citation_issn" content={c['issn']}/>
      volume = c['volume'] && <meta id="meta-volume" name="citation_volume" content={c['volume']}/>
      issue = c['issue'] && <meta id="meta-issue" name="citation_issue" content={c['issue']}/>
    }
    let keywords = a.disciplines ? a.disciplines.join('; ') : null
    d.unit && this.extGA(d.unit.id)  // Google Analytics for external trackers called from PageBase
    return (
      <div>
        <MetaTagsComp title={d.title} descrip={a.abstract}>
          {meta_authors}
        {d.pub_date &&
          <meta id="meta-publication_date" name="citation_publication_date" content={d.pub_date} /> }
        {a.isbn &&
          <meta id="meta-isbn" name="citation_isbn" content={a.isbn} /> }
        {a.doi &&
          <meta id="meta-doi" name="citation_doi" content={a.doi} /> }
        {d.unit && d.unit.type == 'journal' &&
          <meta id="meta-journal_title" name="citation_journal_title" content={d.unit.name} /> }
          {issn} {volume} {issue} {firstpage} {lastpage}
        {d.genre == 'dissertation' && d.header &&
          <meta id="meta-dissertation_institution" name="citation_dissertation_institution" content={d.header.breadcrumb[1]['name']} /> }
        {d.eschol_date &&
          <meta id="meta-online_date" name="citation_online_date" content={d.eschol_date} /> }
        {["withdrawn", "embargoed"].includes(d.status) &&
          <meta id="meta-robots" name="robots" content="noindex" /> }
        {keywords &&
          <meta id="meta-keywords" name="citation_keywords" content={keywords} /> }
        {!d.download_restricted && d.pdf_url &&
          <meta id="meta-pdf_url" name="citation_pdf_url"
                content={d.pdf_url.substr(0, 4) == "http" ? d.pdf_url : "https://escholarship.org" + d.pdf_url} /> }
        </MetaTagsComp>
        <Header2Comp type={d.unit ? d.unit.type: null}
                     unitID={(d.appearsIn && d.appearsIn.length > 0) ? d.appearsIn[0]["id"] : null } />
        {/* Some items have no parent unit, so check for empty d.header */}
        {d.header && <SubheaderComp unit={d.unit} header={d.header} />}
        {d.header && <NavBarComp navBar={d.header.nav_bar} 
                                    unit={d.unit} 
                                    socialProps={d.header.social} />}
        <BreadcrumbComp array={d.header ? d.header.breadcrumb : null} />
        <div className="c-columns--sticky-sidebar">
          <main id="maincontent">
            <ItemActionsComp id={d.id}
                         status={d.status}
                         content_type={d.content_type}
                         pdf_url={d.pdf_url}
                         supp_files={a.supp_files}
                         buy_link={a.buy_link}
                         withdrawn_message={a.withdrawn_message}
                         download_restricted={d.download_restricted} />
            <h2 className="c-tabcontent__main-heading" tabIndex="-1"><ArbitraryHTMLComp html={d.title}/></h2>
            <AuthorListComp pubdate={d.pub_date}
                        authors={d.authors}
                        changeTab={d.changeTab} />
            <PubLocationComp pub_web_loc={a.pub_web_loc}
                         rights={d.rights} />
            <PubDataComp content_type={d.content_type} />
            <TabsComp currentTab={currentTab}
                      changeTab={this.changeTab}
                      formatDate={this.formatDate}
                      {...d} />
          </main>
          <aside>
          {(d.status == "published" && d.content_type) &&
            <section className="o-columnbox1">
              <header>
                <h2>Jump To</h2>
              </header>
              <JumpComp changeTab={this.changeTab} attrs={d.attrs} />
            </section>
          }
          {d.sidebar &&
            <SidebarComp data={d.sidebar}/> }
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = ItemPage;
