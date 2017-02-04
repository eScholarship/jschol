// ##### Pagination Component ##### //

import React from 'react'

class PaginationComp extends React.Component {
  next = this.next.bind(this);
  previous = this.previous.bind(this);
  first = this.first.bind(this);
  last = this.last.bind(this);
  page = this.page.bind(this);

  next(event) {
    if (parseInt(this.props.query.start) + parseInt(this.props.query.rows) <= this.props.count) {
      var newStart = parseInt(this.props.query.start) + parseInt(this.props.query.rows);
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
  }

  previous(event) {
    if (parseInt(this.props.query.start) >= parseInt(this.props.query.rows)) {
      var newStart = parseInt(this.props.query.start) - parseInt(this.props.query.rows);
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
  }

  first(event) {
    $('[form=facetForm][name=start]').val(0);
    $('#facet-form-submit').click();
  }

  last(event) {
    var newStart = Math.floor(this.props.count / this.props.query.rows);
    newStart = newStart * this.props.query.rows;
    $('[form=facetForm][name=start]').val(newStart);
    $('#facet-form-submit').click();
  }

  page(event) {
    var newStart = (event.target.text - 1) * this.props.query.rows;
    $('[form=facetForm][name=start]').val(newStart);
    $('#facet-form-submit').click();
  }
  
  render() {
    var page = Math.ceil(this.props.query.start / this.props.query.rows) + 1;
    var pages = Math.ceil(this.props.count / this.props.query.rows);
    var displayedPages = []

    if (pages <= 2) {
      for (var i=1; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
      <div className="c-pagination">
        <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
        { displayedPages.map(page => {
          return (<a key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
        }) }
        <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
      </div>
      )
    }

    if (page <= 2) {
      for (var i=1; i<=3; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          { displayedPages.map(page => {
            return (<a key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
          }) }
          <span className="c-pagination__ellipses">&hellip;</span>
          <a className="c-pagination__item" onClick={this.last}>{pages}</a>
          <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
    else if (page > pages-2) {
      for (var i=pages-4; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          <a className="c-pagination__item" onClick={this.first}>1</a>
          <span className="c-pagination__ellipses">&hellip;</span>
          { displayedPages.map(page => {
            return (<a key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
          }) }
          <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
    else {
      return (
        <div className="c-pagination">
          <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          <a className="c-pagination__item" onClick={this.first}>1</a>
          <span className="c-pagination__ellipses">&hellip;</span>
          <a className="c-pagination__item" onClick={this.prev}>{page - 1}</a>
          <a className="c-pagination__item c-pagination__item--active">{page}</a>
          <a className="c-pagination__item" onClick={this.next}>{page + 1}</a>
          <span className="c-pagination__ellipses">&hellip;</span>
          <a className="c-pagination__item" onClick={this.last}>{pages}</a>
          <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
  }
}

module.exports = PaginationComp;
