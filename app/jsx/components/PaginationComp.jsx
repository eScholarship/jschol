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
//      alert( $('[form='+this.props.formName+'][name='+start_type+']').val() )
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
    let newStart = Math.floor(this.clampedCount() / rows)
    newStart = newStart * rows
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
  
  render() {
    let p = this.props
    let [rows, start, start_type] = p.is_info ? [12, p.query.info_start, "info_start"] : [p.query.rows, p.query.start, "start"]
    let page = Math.ceil(start / rows) + 1
    let pages = Math.ceil(this.clampedCount() / rows)
    let displayedPages = []

    if (pages <= 2) {
      for (let i=1; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
      <div className="c-pagination">
        <a href="" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
        { displayedPages.map(page => {
          return (<a href="" key={page.num} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a>)
        }) }
        <a href="" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a>
      </div>
      )
    }

    if (page <= 2) {
      for (let i=1; i<=3; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a href="" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
          { displayedPages.map(page => {
            return (<a href="" key={page.num} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a>)
          }) }
          { (pages > 3) && 
            [<span key="0" className="c-pagination__ellipses">&hellip;</span>,
             <a key="1" href="" className="c-pagination__item" onClick={ event => this.last(event, rows, start, start_type) }>{pages}</a>]
          }
          <a href="" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a>
        </div>
      )
    }
    else if (page > pages-2) {
      for (let i=pages-2; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a href="" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
          { (pages > 3) && 
            [<a key="0" href="" className="c-pagination__item" onClick={ event => this.first(event, start, start_type) }>1</a>,
             <span key="1" className="c-pagination__ellipses">&hellip;</span>]
          }
          { displayedPages.map(page => {
            return (<a href="" key={page.num} className={page.className} onClick={ event => this.page(event, rows, start, start_type) }>{page.num}</a>)
          }) }
          <a href="" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a>
        </div>
      )
    }
    else {
      return (
        <div className="c-pagination">
          <a href="" className="c-pagination__prevnext" onClick={ event => this.previous(event, rows, start, start_type) }>Previous</a>
          <a href="" className="c-pagination__item" onClick={ event => this.first(event, start, start_type) }>1</a>
          { (page > 3) ? <span className="c-pagination__ellipses">&hellip;</span> : null }
          <a href="" className="c-pagination__item" onClick={ event => this.previous(event, rows, start, start_type) }>{page - 1}</a>
          <a href="" className="c-pagination__item c-pagination__item--active" onClick={ event => this.page(event, rows, start, start_type) }>{page}</a>
          <a href="" className="c-pagination__item" onClick={ event => this.next(event, rows, start, start_type) }>{page + 1}</a>
          { (page < pages-2) ? <span className="c-pagination__ellipses">&hellip;</span> : null }
          <a href="" className="c-pagination__item" onClick={ event => this.last(event, rows, start, start_type) }>{pages}</a>
          <a href="" className="c-pagination__prevnext" onClick={ event => this.next(event, rows, start, start_type) }>Next</a>
        </div>
      )
    }
  }
}

module.exports = PaginationComp;
