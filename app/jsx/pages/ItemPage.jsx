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
import PubInfoComp from '../components/PubInfoComp.jsx'
import TabsComp from '../components/TabsComp.jsx'
import JumpComp from '../components/JumpComp.jsx'
import SidebarComp from '../components/SidebarComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

const tab_anchors = ['main', 'supplemental', 'metrics', 'author', 'meta']
const anchors = tab_anchors.concat(['article_abstract', 'article_main', 'article_references'])

const MONTHS = [ "January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December" ]

class ItemPage extends PageBase {
  static propTypes = {
    currentTab: PropTypes.oneOf(anchors)
  }

  // TODO:
  // the page data is getting prop drilled all the way down to any child components that need it
  // it would be better to use something like the Context API to pass this data around
  state = { 
    currentTab: "main",
    pageNum: 1
  }

  // handleItemClick = (anchor) => {
  //   console.log('anchor', anchor)
  //   const pageNumber = parseInt(anchor.split('=')[1], 10)
  //   this.setState({ pageNum: pageNumber })
  //   this.changeTab(anchor)
  // }

  // Unit ID for permissions checking
  pagePermissionsUnit() {
    return "root"  // This is only being used for super user access
  }

  tabNameFromHash() {
    return !(typeof location === "undefined") ? location.hash.toLowerCase().replace(/^#/, "") : ""
  }

  // currentTab should be 'main' whenever hash starts with 'article_" (or is empty)
  articleHashHandler = (h, toc) => {
    if (/^article|^$/.test(h))
      return "main"
    if (toc) {
      for (let i in toc.divs) {
        if (h == toc.divs[i].anchor)
          return "main"
      }
    }
    return h
  }

  componentDidMount(...args) {
    this.handleHashChange()

    // Check hash whenever back or forward button clicked
    window.onpopstate = this.handleHashChange

    // This is overriding PageBase componentDidMount
    // ToDo: https://medium.com/@dan_abramov/how-to-use-classes-and-sleep-at-night-9af8de78ccb4
    super.componentDidMount?.apply(this, args)
  }

  // handles passive hash changes (direct URL load or browser nav)
  handleHashChange = () => {
    const toc = this.state.pageData?.attrs?.toc
    const hash = window.location.hash
    const tabName = this.tabNameFromHash()
    const match = hash.match(/page=(\d+)/)
    const pageNum = match ? parseInt(match[1], 10) : null
    const newTab = this.articleHashHandler(tabName, toc)

    // only update state if it differs
    this.setState({currentTab: newTab, pageNum})
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
    let toc = this.state.pageData && this.state.pageData.attrs && this.state.pageData.attrs.toc

    if (toc) {
      const pageNumber = parseInt(tabName.split('=')[1], 10)
      this.setState({ pageNum: pageNumber })
    }

    let newTab = this.articleHashHandler(tabName.toLowerCase().replace(/^#/, ""), toc)

    if (newTab != this.state.currentTab) {
      this.setState({currentTab: this.articleHashHandler(tabName, toc) })
      // Set hash based on what was clicked. Since we are switching tabs,
      // delay a little for the render so the target anchor will be available.
      setTimeout(()=>window.location.hash=tabName, 200)
    } else {
      window.location.hash=tabName
    }
  }

  renderData = data => {
    console.log('d', data)
    let currentTab = tab_anchors.includes(this.state.currentTab) ? this.state.currentTab : "main"
    let d = data
    let a = d.attrs
    let meta_authors = a.author_hide ? null : d.authors.slice(0, 85).map((author, i) => {
      return <meta key={i} id={"meta-author"+i} name="citation_author" content={author.name}/>
     })
    let descr_authors = a.author_hide ? "" : (d.authors.length > 0) ? "Author(s): " + d.authors.slice(0, 85).map((author) => { return author.name }).join('; ') : ""
    let descr_editors = d.editors ? "Editor(s): " + d.editors.slice(0, 85).map((editor) => { return editor.name }).join('; ') : ""
    let descr_advisors = d.advisors ? "Advisor(s): " + d.advisors.slice(0, 85).map((advisor) => { return advisor.name }).join('; ') : ""
    let contribs = [descr_authors, descr_editors, descr_advisors].filter(e => e !== '').join(' | ')
    let journal_title = (d.unit && (d.unit.type == 'journal')) ?
      <meta id="meta-journal_title" name="citation_journal_title" content={d.unit.name} /> : null
    let [issn, volume, issue, firstpage, lastpage] = [null, null, null, null, null]
    if (a['ext_journal']) {
      let extj = a['ext_journal']
      journal_title = extj['name'] && <meta id="meta-journal_title" name="citation_journal_title" content={extj['name']}/>
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
    let isWithdrawn = /withdrawn/.test(d.status)
    d.unit && this.extGA(d.unit.id)  // Google Analytics for external trackers called from PageBase

    return (
      <div>
        {d.status == "pending" && <span className="c-preview-watermark" />}
        {isWithdrawn && <MetaTagsComp> <meta id="meta-robots" name="robots" content="noindex" /> </MetaTagsComp>}
        {!isWithdrawn &&
          <MetaTagsComp title={d.title} contribs={contribs} abstract={a.abstract}>
            {meta_authors}
            {d.published &&
              <meta id="meta-publication_date" name="citation_publication_date" content={d.published} /> }
            {a.isbn &&
              <meta id="meta-isbn" name="citation_isbn" content={a.isbn} /> }
            {a.doi &&
              <meta id="meta-doi" name="citation_doi" content={a.doi} /> }
            {journal_title} {issn} {volume} {issue} {firstpage} {lastpage}
            {d.genre == 'dissertation' && d.header &&
              <meta id="meta-dissertation_institution" name="citation_dissertation_institution" content={d.header.breadcrumb[1]['name']} /> }
            {d.added &&
              <meta id="meta-online_date" name="citation_online_date" content={d.added} /> }
            {keywords &&
              <meta id="meta-keywords" name="citation_keywords" content={keywords} /> }
            {!d.download_restricted && d.pdf_url &&
              <meta id="meta-pdf_url" name="citation_pdf_url"
                    content={d.pdf_url.substr(0, 4) == "http" ? d.pdf_url : "https://escholarship.org" + d.pdf_url} /> }
            {/* rel=canonical below helps ensure Google Scholar indexes the correct domain */}
            <link rel="canonical" href={"https://escholarship.org/uc/item/" + d.id} />
          </MetaTagsComp>
        }
        <Header2Comp type={d.unit ? d.unit.type: null}
                     unitID={(d.appearsIn && d.appearsIn.length > 0) ? d.appearsIn[0]["id"] : null}
                     hideAdminBar={true} />
        {/* Some items have no parent unit, so check for empty d.header */}
        {d.header && <SubheaderComp unit={d.unit} header={d.header} />}
        {d.header && <NavBarComp navBar={d.header.nav_bar}
                                    unit={d.unit}
                                    socialProps={d.header.social} />}
        <BreadcrumbComp array={d.header ? d.header.breadcrumb : null} />
        <div className={this.state.fetchingData ? "c-columns--sticky-sidebar is-loading-data" : "c-columns--sticky-sidebar"}>
          <main id="maincontent">
            <ItemActionsComp id={d.id}
                         status={d.status}
                         content_type={d.content_type}
                         pdf_url={d.pdf_url}
                         attrs={d.attrs}
                         download_restricted={d.download_restricted}
                         sendApiData={this.sendApiData}
			 journal_id={d.unit.id}/>
            <h2 className="c-tabcontent__main-heading" tabIndex="-1"><ArbitraryHTMLComp html={d.title}/></h2>
            <AuthorListComp pubdate={d.published}
                          source={d.source}
                          author_hide={a.author_hide}
                          authors={d.authors}
                          editors={d.editors}
                          advisors={d.advisors}
                          changeTab={this.changeTab} />
          {(a.doi || a.pub_web_loc || d.rights || d.attrs.data_avail_stmnt || !d.content_type) && !isWithdrawn &&
            <PubInfoComp doi={a.doi}
                         pub_web_loc={a.pub_web_loc}
                         content_type={d.content_type}
                         data_avail_stmnt={d.attrs.data_avail_stmnt}
                         rights={d.rights} />
          }
            <TabsComp currentTab={currentTab}
                      changeTab={this.changeTab}
                      formatDate={this.formatDate}
                      pageNum={this.state.pageNum} 
                      // onItemClick={this.handleItemClick}
                      {...d} />
          </main>
          <aside>
          {(d.status == "published" && d.content_type) &&
            <JumpComp 
              changeTab={this.changeTab} 
              genre={d.genre} 
              attrs={d.attrs} 
              // onItemClick={this.handleItemClick}
            />
          }
          {d.sidebar && !isWithdrawn &&
            <SidebarComp data={d.sidebar}/> }
          </aside>
        </div>
      </div>
    )
  }
}

export default ItemPage;
