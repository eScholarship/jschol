// ##### Pagination Component ##### //

import React from 'react'

class PaginationComp extends React.Component {
  clampedCount() {
    // AWS CloudSearch will not let us paginate beyond 10,000 results - so limit the pagination to that.
    return Math.min(this.props.count, 9999)
  }

  next = event=>{
    if (parseInt(this.props.query.start) + parseInt(this.props.query.rows) <= this.clampedCount()) {
      var newStart = parseInt(this.props.query.start) + parseInt(this.props.query.rows);
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
    event.preventDefault()
  }

  previous = event=>{
    if (parseInt(this.props.query.start) >= parseInt(this.props.query.rows)) {
      var newStart = parseInt(this.props.query.start) - parseInt(this.props.query.rows);
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
    event.preventDefault()
  }

  first = event=>{
    if (parseInt(this.props.query.start) > 0) {
      $('[form=facetForm][name=start]').val(0);
      $('#facet-form-submit').click();
    }
    event.preventDefault()
  }

  last = event=>{
    var newStart = Math.floor(this.clampedCount() / this.props.query.rows);
    newStart = newStart * this.props.query.rows;
    if (newStart != this.props.query.start) {
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
    event.preventDefault()
  }

  page = event=>{
    var newStart = (event.target.text - 1) * this.props.query.rows;
    if (newStart != this.props.query.start) {
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
    event.preventDefault()
  }
  
  render() {
    var page = Math.ceil(this.props.query.start / this.props.query.rows) + 1;
    var pages = Math.ceil(this.clampedCount() / this.props.query.rows);
    var displayedPages = []

    if (pages <= 2) {
      for (var i=1; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
      <div className="c-pagination">
        <a href="" className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
        { displayedPages.map(page => {
          return (<a href="" key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
        }) }
        <a href="" className="c-pagination__prevnext" onClick={this.next}>Next</a>
      </div>
      )
    }

    if (page <= 2) {
      for (var i=1; i<=3; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a href="" className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          { displayedPages.map(page => {
            return (<a href="" key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
          }) }
          { (pages > 3) && 
            [<span key="0" className="c-pagination__ellipses">&hellip;</span>,
             <a key="1" href="" className="c-pagination__item" onClick={this.last}>{pages}</a>]
          }
          <a href="" className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
    else if (page > pages-2) {
      for (var i=pages-2; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a href="" className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          { (pages > 3) && 
            [<a key="0" href="" className="c-pagination__item" onClick={this.first}>1</a>,
             <span key="1" className="c-pagination__ellipses">&hellip;</span>]
          }
          { displayedPages.map(page => {
            return (<a href="" key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
          }) }
          <a href="" className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
    else {
      return (
        <div className="c-pagination">
          <a href="" className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          <a href="" className="c-pagination__item" onClick={this.first}>1</a>
          { (page > 3) ? <span className="c-pagination__ellipses">&hellip;</span> : null }
          <a href="" className="c-pagination__item" onClick={this.previous}>{page - 1}</a>
          <a href="" className="c-pagination__item c-pagination__item--active" onClick={this.page}>{page}</a>
          <a href="" className="c-pagination__item" onClick={this.next}>{page + 1}</a>
          { (page < pages-2) ? <span className="c-pagination__ellipses">&hellip;</span> : null }
          <a href="" className="c-pagination__item" onClick={this.last}>{pages}</a>
          <a href="" className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
  }
}

module.exports = PaginationComp;
