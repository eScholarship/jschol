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
    let page = Math.ceil(start / rows) + 1
    let pages = Math.ceil(this.clampedCount() / rows)

    if (pages <= 2) {
      let displayedPages = this.getPaging(page, 1, pages)
      return (
      <ul>
        <li>
        {page == 1 ?
          <span aria-label="go to previous result set" className="c-pagination__prevnext">Previous</span>
        :
          <a href="" aria-label="go to previous result set" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
        }
        </li>
        { displayedPages.map(page => {
          return (<li key={page.num}><a href="" aria-label={page.label} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a></li>)
        }) }
        <li><a href="" aria-label="go to next result set" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a></li>
      </ul>
      )
    }

    if (page <= 2) {
      let displayedPages = this.getPaging(page, 1, 3)
      return (
        <ul>
          <li>
          {page == 1 ?
            <span aria-label="go to previous result set" className="c-pagination__prevnext">Previous</span>
          :
            <a href="" aria-label="go to previous result set" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
          }
          </li>
          { displayedPages.map(page => {
            return (<li key={page.num}><a href="" aria-label={page.label} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a></li>)
          }) }
          { (pages > 3) && 
             <li><a href="" aria-label={"go to result set "+pages} className="c-pagination__item" onClick={ event => this.last(event, rows, start, start_type) }>{pages}</a></li>
          }
          <li><a href="" aria-label="go to next result set" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a></li>
        </ul>
      )
    }
    else if (page > pages-2) {
      let displayedPages = this.getPaging(page, pages-2, pages)
      return (
        <ul>
          <li>
          {page == 1 ?
            <span aria-label="go to previous result set" className="c-pagination__prevnext">Previous</span>
          :
            <a href="" aria-label="go to previous result set" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
          }
          </li>
          { (pages > 3) && 
            <li><a href="" aria-label="go to result set 1" className="c-pagination__item" onClick={ event => this.first(event, start, start_type) }>1</a></li>
          }
          { displayedPages.map(page => {
            return (<li key={page.num}><a href="" aria-label={page.label} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a></li>)
          }) }
          <li><a href="" aria-label="go to next result set" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a></li>
        </ul>
      )
    }
    else {
      return (
        <ul>
          <li>
          {page == 1 ?
            <span aria-label="go to previous result set" className="c-pagination__prevnext">Previous</span>
          :
            <a href="" aria-label="go to previous result set" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
          }
          </li>
          <li><a href="" aria-label="go to result set 1" className="c-pagination__item" onClick={ event => this.first(event, start, start_type) }>1</a></li>
          <li><a href="" aria-label={"go to result set "+(page - 1)} className="c-pagination__item" onClick={ event => this.previous(event, rows, start, start_type) }>{page - 1}</a></li>
          <li><a href="" aria-label={"you are on result set "+page} className="c-pagination__item c-pagination__item--current" onClick={ event => this.page(event, rows, start, start_type) }>{page}</a></li>
          <li><a href="" aria-label={"go to result set "+(page + 1)} className="c-pagination__item" onClick={ event => this.next(event, rows, start, start_type) }>{page + 1}</a></li>
          <li><a href="" aria-label={"go to result set "+pages} className="c-pagination__item" onClick={ event => this.last(event, rows, start, start_type) }>{pages}</a></li>
          <li><a href="" aria-label="go to next result set" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a></li>
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
