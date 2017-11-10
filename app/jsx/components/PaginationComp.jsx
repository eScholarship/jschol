// ##### Pagination Component ##### //

import React from 'react'
import PropTypes from 'prop-types'

class PaginationComp extends React.Component {
  static propTypes = {
    query: PropTypes.shape({
      q: PropTypes.string,
      rows: PropTypes.string,
      sort: PropTypes.string,
      info_start: PropTypes.string,
      start: PropTypes.string
    }).isRequired,
    is_info: PropTypes.bool
  }

  clampedCount() {
    // AWS CloudSearch will not let us paginate beyond 10,000 results - so limit the pagination to that.
    return Math.min(this.props.count, 9999)
  }

  next = (event, rows, start, start_type) =>{
    event.preventDefault()
    if (parseInt(start) + parseInt(rows) <= this.clampedCount()) {
      let newStart = parseInt(start) + parseInt(rows)
      $('[form='+this.props.formName+'][name='+start_type+']').val(newStart)
      $('#'+this.props.formButton).click()
    }
  }

  previous = (event, rows, start, start_type) =>{
    event.preventDefault()
    if (parseInt(start) >= parseInt(rows)) {
      let newStart = parseInt(start) - parseInt(rows)
      $('[form='+this.props.formName+'][name='+start_type+']').val(newStart)
      $('#'+this.props.formButton).click()
    }
  }

  first = (event, start, start_type) =>{
    event.preventDefault()
    if (parseInt(start) > 0) {
      $('[form='+this.props.formName+'][name='+start_type+']').val(0)
      $('#'+this.props.formButton).click()
    }
  }

  last = (event, rows, start, start_type) =>{
    event.preventDefault()
    let floor = Math.floor(this.clampedCount() / rows),
        newStart = floor * rows
    newStart = (this.clampedCount() % rows > 0) ? newStart : newStart - rows
    if (newStart != start) {
      $('[form='+this.props.formName+'][name='+start_type+']').val(newStart)
      $('#'+this.props.formButton).click()
    }
  }

  page = (event, rows, start, start_type) =>{
    event.preventDefault()
    let newStart = (event.target.text - 1) * rows
    if (newStart != start) {
      $('[form='+this.props.formName+'][name='+start_type+']').val(newStart)
      $('#'+this.props.formButton).click()
    }
  }

  // Accept 'dir' value of "Previous" or "Next"
  // Accept 'pg' value of 1 to check for first page and -1 to check for last
  prevNextButton = (dir, pg, rows, start, start_type) => {
    let unlinked = (dir == "Previous") ? 1 : -1
    return (
      pg == unlinked ?
        <span aria-label={"go to "+dir+" result set"} className="c-pagination__prevnext">{dir}</span>
      :
        (dir == "Previous") ? 
          <a href="" aria-label={"go to "+dir+" result set"} className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>{dir}</a>
        : 
          <a href="" aria-label={"go to "+dir+" result set"} className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>{dir}</a>
    )
  }

  getPaging(page, first, last) { 
    let r = []
    for (let i=first; i<=last; i++) {
      r.push({num: i,
              className: i == page ? "c-pagination__item--current" : "c-pagination__item",
              label: i == page ? "you are on result set "+i : "go to result set "+i})
    }
    return r
  }

  renderPagination() {
    let p = this.props
    let [rows, start, start_type] = p.is_info ? [12, p.query.info_start, "info_start"] : [p.query.rows, p.query.start, "start"]
    let this_pg = Math.ceil(start / rows) + 1
    let pages = Math.ceil(this.clampedCount() / rows)
    let last_flag = (this_pg == pages) ? -1 : this_pg // Set last page flag to -1 for prevNextButton function if we're on last page

    if (pages <= 2) {
      let displayedPages = this.getPaging(this_pg, 1, pages)
      return (
      <ul>
        <li>{this.prevNextButton("Previous", this_pg, rows, start, start_type)}</li>
        { displayedPages.map(page => {
          return (<li key={page.num}><a href="" aria-label={page.label} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a></li>)
        }) }
        <li>{this.prevNextButton("Next", last_flag, rows, start, start_type)}</li>
      </ul>
      )
    }

    if (this_pg <= 2) {
      let displayedPages = this.getPaging(this_pg, 1, 3)
      return (
        <ul>
          <li>{this.prevNextButton("Previous", this_pg, rows, start, start_type)}</li>
          { displayedPages.map(page => {
            return (<li key={page.num}><a href="" aria-label={page.label} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a></li>)
          }) }
          { (pages > 3) && 
             <li><a href="" aria-label={"go to result set "+pages} className="c-pagination__item" onClick={ event => this.last(event, rows, start, start_type) }>{pages}</a></li>
          }
          <li>{this.prevNextButton("Next", last_flag, rows, start, start_type)}</li>
        </ul>
      )
    }
    else if (this_pg > pages-2) {
      let displayedPages = this.getPaging(this_pg, pages-2, pages)
      return (
        <ul>
          <li>{this.prevNextButton("Previous", this_pg, rows, start, start_type)}</li>
          { (pages > 3) && 
            <li><a href="" aria-label="go to result set 1" className="c-pagination__item" onClick={ event => this.first(event, start, start_type) }>1</a></li>
          }
          { displayedPages.map(page => {
            return (<li key={page.num}><a href="" aria-label={page.label} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a></li>)
          }) }
          <li>{this.prevNextButton("Next", last_flag, rows, start, start_type)}</li>
        </ul>
      )
    }
    else {
      return (
        <ul>
          <li>{this.prevNextButton("Previous", this_pg, rows, start, start_type)}</li>
          <li><a href="" aria-label="go to result set 1" className="c-pagination__item" onClick={ event => this.first(event, start, start_type) }>1</a></li>
          <li><a href="" aria-label={"go to result set "+(this_pg - 1)} className="c-pagination__item" onClick={ event => this.previous(event, rows, start, start_type) }>{this_pg - 1}</a></li>
          <li><a href="" aria-label={"you are on result set "+this_pg} className="c-pagination__item c-pagination__item--current" onClick={ event => this.page(event, rows, start, start_type) }>{this_pg}</a></li>
          <li><a href="" aria-label={"go to result set "+(this_pg + 1)} className="c-pagination__item" onClick={ event => this.next(event, rows, start, start_type) }>{this_pg + 1}</a></li>
          <li><a href="" aria-label={"go to result set "+pages} className="c-pagination__item" onClick={ event => this.last(event, rows, start, start_type) }>{pages}</a></li>
          <li>{this.prevNextButton("Next", last_flag, rows, start, start_type)}</li>
        </ul>
      )
    }
  }

  render() {
    return (
      <nav className="c-pagination">
      {this.props.is_info &&
        <input type="hidden" name="info_start" form={this.props.formName} value={this.props.query.info_start} />
      }
        {this.renderPagination()}
      </nav>
    )
  }

}

module.exports = PaginationComp;
